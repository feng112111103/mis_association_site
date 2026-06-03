import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import jwt from "jsonwebtoken";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

// 🌟 輔助函式：用來手動解析 req.headers.cookie
function getCookie(cookieStr: string | undefined, name: string): string | null {
  if (!cookieStr) return null;
  const cookies = cookieStr.split(";").map(c => c.trim());
  const target = cookies.find(c => c.startsWith(`${name}=`));
  return target ? decodeURIComponent(target.split("=")[1]) : null;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // 1️⃣ 讀取我們在登入成功時種下的 Cookie 通行證
    const sessionCookie = getCookie(opts.req.headers.cookie, "app_session_id");

    if (sessionCookie) {
      // 2️⃣ 透過本地金鑰解密 JWT
      const decoded = jwt.verify(sessionCookie, process.env.JWT_SECRET || "aa86853587") as any;

      // 3️⃣ 🌟 魔改核心：組裝出一個完全符合 Drizzle Schema 的 User 物件
      // 並且強制注入 role: 'admin'，讓 tRPC 所有的保護關卡全部對你大開綠燈！
      user = {
        id: decoded.userId || 999,
        openId: decoded.openId || `local_${decoded.username}`,
        name: decoded.username || "最高管理員",
        email: `${decoded.username}@example.com`,
        role: "admin",         // 👈 讓 tRPC 認可你是最高權限管理員，可以改動網頁版面！
        isAdmin: true,        // 👈 雙重保險
        createdAt: new Date(),
        updatedAt: new Date(),
        // 💡 如果你的 drizzle/schema 裡的 User 還有其他必填欄位，可以在這裡補上預設值
      } as unknown as User;   // 透過 unknown 強制轉型，確保 TypeScript 絕對不報錯
    }
  } catch (error) {
    // 驗證失敗或未登入時，讓 user 保持為 null，公開頁面（如首頁）依然能正常瀏覽
    console.warn("[tRPC Auth] 本地解密失敗或未登入");
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}