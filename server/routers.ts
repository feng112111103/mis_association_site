import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { invokeLLM } from "./_core/llm";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createAnnouncement,
  createEvent,
  createOrgMember,
  createResource,
  deleteAnnouncement,
  deleteEvent,
  deleteOrgMember,
  deleteResource,
  getAnnouncementById,
  getEventById,
  getResourceById,
  incrementDownloadCount,
  listAnnouncements,
  listEvents,
  listOrgMembers,
  listResources,
  updateAnnouncement,
  updateEvent,
  updateOrgMember,
  updateResource,
} from "./db";
import { storagePut } from "./storage";

// ─── Admin guard ──────────────────────────────────────────────────────────────
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "需要管理員權限" });
  }
  return next({ ctx });
});

// ─── Announcements ────────────────────────────────────────────────────────────
const announcementsRouter = router({
  list: publicProcedure
    .input(z.object({ all: z.boolean().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      const publishedOnly = !isAdmin || !input?.all;
      return listAnnouncements(publishedOnly);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getAnnouncementById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z.string().optional(),
        isPinned: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createAnnouncement({
        title: input.title,
        content: input.content,
        category: input.category ?? "一般",
        isPinned: input.isPinned ?? false,
        isPublished: input.isPublished ?? true,
        authorId: ctx.user.id,
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        category: z.string().optional(),
        isPinned: z.boolean().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateAnnouncement(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteAnnouncement(input.id);
      return { success: true };
    }),
});

// ─── Events ───────────────────────────────────────────────────────────────────
const eventsRouter = router({
  list: publicProcedure
    .input(z.object({ all: z.boolean().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      const publishedOnly = !isAdmin || !input?.all;
      return listEvents(publishedOnly);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getEventById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        location: z.string().optional(),
        startAt: z.number(),
        endAt: z.number().optional(),
        imageUrl: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createEvent({
        title: input.title,
        description: input.description,
        location: input.location ?? "",
        startAt: new Date(input.startAt),
        endAt: input.endAt ? new Date(input.endAt) : null,
        imageUrl: input.imageUrl ?? null,
        isPublished: input.isPublished ?? true,
        authorId: ctx.user.id,
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        location: z.string().optional(),
        startAt: z.number().optional(),
        endAt: z.number().nullable().optional(),
        imageUrl: z.string().nullable().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, startAt, endAt, ...rest } = input;
      const data: Record<string, unknown> = { ...rest };
      if (startAt !== undefined) data.startAt = new Date(startAt);
      if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null;
      await updateEvent(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteEvent(input.id);
      return { success: true };
    }),
});

// ─── Resources ────────────────────────────────────────────────────────────────
const resourcesRouter = router({
  list: publicProcedure
    .input(z.object({ all: z.boolean().optional() }).optional())
    .query(async ({ input, ctx }) => {
      const isAdmin = ctx.user?.role === "admin";
      const publishedOnly = !isAdmin || !input?.all;
      return listResources(publishedOnly);
    }),

  get: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const item = await getResourceById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      return item;
    }),

  getUploadUrl: adminProcedure
    .input(
      z.object({
        fileName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        fileData: z.string(), // base64
      })
    )
    .mutation(async ({ input }) => {
      const buf = Buffer.from(input.fileData, "base64");
      const key = `resources/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buf, input.mimeType);
      return { key, url };
    }),

  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        category: z.string().optional(),
        fileKey: z.string(),
        fileUrl: z.string(),
        fileName: z.string(),
        fileSize: z.number().optional(),
        mimeType: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await createResource({
        title: input.title,
        description: input.description ?? "",
        category: input.category ?? "其他",
        fileKey: input.fileKey,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        fileSize: input.fileSize ?? 0,
        mimeType: input.mimeType ?? "",
        isPublished: input.isPublished ?? true,
        authorId: ctx.user.id,
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateResource(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteResource(input.id);
      return { success: true };
    }),

  download: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const item = await getResourceById(input.id);
      if (!item) throw new TRPCError({ code: "NOT_FOUND" });
      await incrementDownloadCount(input.id);
      return { url: item.fileUrl };
    }),
});

// ─── Org Members ──────────────────────────────────────────────────────────────
const orgRouter = router({
  list: publicProcedure.query(() => listOrgMembers()),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        title: z.string().min(1),
        department: z.string().min(1),
        email: z.string().optional(),
        description: z.string().optional(),
        avatarUrl: z.string().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      await createOrgMember({
        name: input.name,
        title: input.title,
        department: input.department,
        email: input.email ?? "",
        description: input.description ?? "",
        avatarUrl: input.avatarUrl ?? null,
        sortOrder: input.sortOrder ?? 0,
      });
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().optional(),
        title: z.string().optional(),
        department: z.string().optional(),
        email: z.string().optional(),
        description: z.string().optional(),
        avatarUrl: z.string().nullable().optional(),
        sortOrder: z.number().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateOrgMember(id, data);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteOrgMember(input.id);
      return { success: true };
    }),
});

// ─── AI Assistant ─────────────────────────────────────────────────────────────
const aiRouter = router({
  chat: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "assistant"]),
              content: z.string(),
            })
          )
          .optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Gather context from DB
      const [announcementList, eventList, resourceList, memberList] = await Promise.all([
        listAnnouncements(true),
        listEvents(true),
        listResources(true),
        listOrgMembers(),
      ]);

      const now = new Date();
      const announcementContext = announcementList
        .slice(0, 10)
        .map((a) => `【公告】${a.title}（${a.category}）：${a.content.slice(0, 200)}`)
        .join("\n");

      const eventContext = eventList
        .slice(0, 10)
        .map(
          (e) =>
            `【活動】${e.title}，時間：${new Date(e.startAt).toLocaleDateString("zh-TW")}，地點：${e.location}，說明：${e.description.slice(0, 150)}`
        )
        .join("\n");

      const resourceContext = resourceList
        .slice(0, 10)
        .map((r) => `【資源】${r.title}（${r.category}）：${r.description}`)
        .join("\n");

      const memberContext = memberList
        .slice(0, 20)
        .map((m) => `【幹部】${m.department} - ${m.title} ${m.name}`)
        .join("\n");

      const systemPrompt = `你是亞東科技大學資訊管理系學會的 AI 助理，名叫「資管小幫手」。
你的任務是根據系學會的最新資訊，親切、準確地回答同學的問題。
請用繁體中文回答，語氣友善、簡潔，並在適當時使用 Markdown 格式。

目前日期：${now.toLocaleDateString("zh-TW")}

以下是系學會的最新資訊：

${announcementContext || "（目前無公告）"}

${eventContext || "（目前無活動）"}

${resourceContext || "（目前無資源）"}

${memberContext || "（目前無幹部資料）"}

如果問題超出以上資訊範圍，請誠實說明你不確定，並建議同學聯繫系學會。`;

      const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
        { role: "system", content: systemPrompt },
        ...(input.history ?? []),
        { role: "user", content: input.message },
      ];

      const response = await invokeLLM({ messages });
      const content = response.choices?.[0]?.message?.content ?? "抱歉，我目前無法回答這個問題。";
      return { content };
    }),
});

// ─── App Router ───────────────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  announcements: announcementsRouter,
  events: eventsRouter,
  resources: resourcesRouter,
  org: orgRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;
