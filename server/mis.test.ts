import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the DB module so tests don't need a real database
vi.mock("./db", () => ({
  listAnnouncements: vi.fn().mockResolvedValue([
    { id: 1, title: "測試公告", content: "內容", category: "一般", isPinned: false, isPublished: true, authorId: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getAnnouncementById: vi.fn().mockResolvedValue({
    id: 1, title: "測試公告", content: "內容", category: "一般", isPinned: false, isPublished: true, authorId: null, createdAt: new Date(), updatedAt: new Date(),
  }),
  createAnnouncement: vi.fn().mockResolvedValue({}),
  updateAnnouncement: vi.fn().mockResolvedValue({}),
  deleteAnnouncement: vi.fn().mockResolvedValue({}),
  listEvents: vi.fn().mockResolvedValue([
    { id: 1, title: "測試活動", description: "說明", location: "B棟", startAt: new Date(), endAt: null, imageUrl: null, isPublished: true, authorId: null, createdAt: new Date(), updatedAt: new Date() },
  ]),
  getEventById: vi.fn().mockResolvedValue(null),
  createEvent: vi.fn().mockResolvedValue({}),
  updateEvent: vi.fn().mockResolvedValue({}),
  deleteEvent: vi.fn().mockResolvedValue({}),
  listResources: vi.fn().mockResolvedValue([]),
  getResourceById: vi.fn().mockResolvedValue(null),
  createResource: vi.fn().mockResolvedValue({}),
  updateResource: vi.fn().mockResolvedValue({}),
  deleteResource: vi.fn().mockResolvedValue({}),
  incrementDownloadCount: vi.fn().mockResolvedValue({}),
  listOrgMembers: vi.fn().mockResolvedValue([
    { id: 1, name: "王小明", title: "會長", department: "會長室", email: "", description: "", avatarUrl: null, sortOrder: 0, createdAt: new Date(), updatedAt: new Date() },
  ]),
  createOrgMember: vi.fn().mockResolvedValue({}),
  updateOrgMember: vi.fn().mockResolvedValue({}),
  deleteOrgMember: vi.fn().mockResolvedValue({}),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{ message: { content: "這是 AI 的回答" } }],
  }),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test-key", url: "/manus-storage/test-key" }),
}));

function createPublicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createAdminCtx(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-open-id",
      name: "Admin",
      email: "admin@example.com",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

describe("announcements router", () => {
  it("list returns announcements for public users", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.announcements.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]?.title).toBe("測試公告");
  });

  it("get returns a single announcement by id", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.announcements.get({ id: 1 });
    expect(result.id).toBe(1);
    expect(result.title).toBe("測試公告");
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.announcements.create({ title: "Test", content: "Content" })
    ).rejects.toThrow();
  });

  it("create succeeds for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.announcements.create({ title: "Test", content: "Content" });
    expect(result.success).toBe(true);
  });
});

describe("events router", () => {
  it("list returns events for public users", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.events.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.events.create({ title: "Event", description: "Desc", startAt: Date.now() })
    ).rejects.toThrow();
  });
});

describe("org router", () => {
  it("list returns org members", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.org.list();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.name).toBe("王小明");
  });
});

describe("resources router", () => {
  it("list returns resources for public users", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.resources.list();
    expect(Array.isArray(result)).toBe(true);
  });

  it("create requires admin role", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    await expect(
      caller.resources.create({
        title: "資源",
        fileKey: "k",
        fileUrl: "u",
        fileName: "f",
      })
    ).rejects.toThrow();
  });

  it("create succeeds for admin", async () => {
    const caller = appRouter.createCaller(createAdminCtx());
    const result = await caller.resources.create({
      title: "測試資源",
      fileKey: "resources/test.pdf",
      fileUrl: "/manus-storage/test.pdf",
      fileName: "test.pdf",
    });
    expect(result.success).toBe(true);
  });
});

describe("ai router", () => {
  it("chat returns AI response", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.ai.chat({ message: "最新公告是什麼？" });
    expect(typeof result.content).toBe("string");
    expect(result.content.length).toBeGreaterThan(0);
  });
});

describe("auth router", () => {
  it("me returns null for unauthenticated user", async () => {
    const caller = appRouter.createCaller(createPublicCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("logout clears session cookie", async () => {
    const ctx = createAdminCtx();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
  });
});
