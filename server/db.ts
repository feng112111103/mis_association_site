import { and, desc, eq, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  announcements,
  events,
  InsertAnnouncement,
  InsertEvent,
  InsertOrgMember,
  InsertResource,
  InsertUser,
  orgMembers,
  resources,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Announcements ────────────────────────────────────────────────────────────

export async function listAnnouncements(publishedOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = publishedOnly ? [eq(announcements.isPublished, true)] : [];
  return db
    .select()
    .from(announcements)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}

export async function getAnnouncementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return result[0];
}

export async function createAnnouncement(data: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const result = await db.insert(announcements).values(data);
  return result;
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(announcements).where(eq(announcements.id, id));
}

// ─── Events ───────────────────────────────────────────────────────────────────

export async function listEvents(publishedOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = publishedOnly ? [eq(events.isPublished, true)] : [];
  return db
    .select()
    .from(events)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(events.startAt));
}

export async function getEventById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return result[0];
}

export async function createEvent(data: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(events).values(data);
}

export async function updateEvent(id: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(events).set(data).where(eq(events.id, id));
}

export async function deleteEvent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(events).where(eq(events.id, id));
}

// ─── Resources ────────────────────────────────────────────────────────────────

export async function listResources(publishedOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions = publishedOnly ? [eq(resources.isPublished, true)] : [];
  return db
    .select()
    .from(resources)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(resources.createdAt));
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  return result[0];
}

export async function createResource(data: InsertResource) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(resources).values(data);
}

export async function updateResource(id: number, data: Partial<InsertResource>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(resources).set(data).where(eq(resources.id, id));
}

export async function deleteResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(resources).where(eq(resources.id, id));
}

export async function incrementDownloadCount(id: number) {
  const db = await getDb();
  if (!db) return;
  const resource = await getResourceById(id);
  if (!resource) return;
  return db
    .update(resources)
    .set({ downloadCount: resource.downloadCount + 1 })
    .where(eq(resources.id, id));
}

// ─── Org Members ──────────────────────────────────────────────────────────────

export async function listOrgMembers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orgMembers).orderBy(orgMembers.sortOrder, orgMembers.id);
}

export async function createOrgMember(data: InsertOrgMember) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(orgMembers).values(data);
}

export async function updateOrgMember(id: number, data: Partial<InsertOrgMember>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.update(orgMembers).set(data).where(eq(orgMembers.id, id));
}

export async function deleteOrgMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.delete(orgMembers).where(eq(orgMembers.id, id));
}
