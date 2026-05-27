# 亞東科技大學資管系學會網站 TODO

## 資料庫 Schema
- [x] announcements 公告資料表
- [x] events 活動資料表
- [x] resources 資源下載資料表
- [x] org_members 組織幹部資料表

## 後端 API（tRPC）
- [x] announcements CRUD（publicProcedure list/get + adminProcedure create/update/delete）
- [x] events CRUD
- [x] resources CRUD + S3 上傳
- [x] orgMembers list + CRUD
- [x] ai.chat 問答（含網站內容 context）

## 前端頁面
- [x] 全域導覽列（含行動版漢堡選單）
- [x] 首頁 Landing Page（Hero、最新公告、近期活動、AI 入口）
- [x] 公告列表頁（/announcements）
- [x] 公告詳細頁（/announcements/:id）
- [x] 活動列表頁（/events）
- [x] 組織介紹頁（/organization）
- [x] 資源下載頁（/resources）
- [x] AI 問答助理頁（/ai-assistant）
- [x] 管理員後台首頁（/admin）
- [x] 管理員公告管理（/admin/announcements）
- [x] 管理員活動管理（/admin/events）
- [x] 管理員資源管理（/admin/resources）
- [x] 管理員組織管理（/admin/organization）

## 視覺設計
- [x] 整體色彩系統（深藍 + 金色 accent）
- [x] 全域 CSS 變數與字型設定（Noto Serif TC + Noto Sans TC）
- [x] 響應式設計（mobile-first）
- [x] 動畫與微互動（fadeInUp、card-hover、button active scale）

## 測試
- [x] announcements router vitest（list, get, create 權限）
- [x] events router vitest（list, create 權限）
- [x] org router vitest（list）
- [x] ai router vitest（chat）
- [x] auth router vitest（me, logout）
- [x] resources router vitest（list, create 權限）
- [x] 全部 14 個測試通過

## 修正與優化
- [x] CSS @import 順序修正（Google Fonts 移至最前）
- [x] OAuth 登入後返回 returnPath（修正 const.ts + oauth.ts）
- [x] AdminLayout 登入按鈕傳入 returnPath="/admin"
