export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Generate login URL at runtime so redirect URI reflects the current origin.
// Pass `returnPath` (e.g. "/admin") to redirect back to that page after login.
export const getLoginUrl = (returnPath?: string) => {
  // 🌟 1. 強制讓回傳路徑改去後台管理 /admin，這樣登入完才會直接進去
  const actualReturnPath = returnPath || "/admin";

  // 2. 依然保留原本的 origin 安全機制
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  
  // 3. 把新的回傳路徑編碼進 state
  const statePayload = JSON.stringify({ redirectUri, returnPath: actualReturnPath });
  const state = btoa(statePayload);

  // 🌟 4. 簡化：直接把目的地寫死成你自己的在地後端 (localhost:3000)
  const url = new URL("http://localhost:3000/app-auth");
  url.searchParams.set("appId", "test");
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  return url.toString();
};