import express, { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));

// 自動相容原本舊專案或新專案的 .env 資料庫設定
const dbUrl = process.env.DATABASE_URL;
let pool: mysql.Pool;

if (dbUrl) {
  pool = mysql.createPool(dbUrl);
} else {
  pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mis_school',
  });
}

// ==================== 路由 1：提供登入/註冊 HTML 介面 ====================
app.get('/app-auth', (req: Request, res: Response) => {
  const redirectUri = req.query.redirectUri as string || 'http://localhost:5173/';
  
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>自主掌控 - 核心登入中心</title>
      <style>
        body { font-family: sans-serif; background: #f3f4f6; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 300px; }
        h2 { margin-top: 0; color: #333; text-align: center; }
        input { width: 100%; padding: 10px; margin: 10px 0; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
        button { width: 100%; padding: 10px; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #1d4ed8; }
        .switch { text-align: center; margin-top: 15px; font-size: 14px; color: #666; cursor: pointer; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2 id="title">會員登入</h2>
        <form id="authForm">
          <input type="text" id="username" placeholder="請輸入帳號" required />
          <input type="password" id="password" placeholder="請輸入密碼" required />
          <button type="submit" id="btn">登入</button>
        </form>
        <div class="switch" id="toggleMode">沒有帳號？切換到註冊</div>
      </div>

      <script>
        let isLoginMode = true;
        
        document.getElementById('toggleMode').addEventListener('click', () => {
          isLoginMode = !isLoginMode;
          document.getElementById('title').innerText = isLoginMode ? '會員登入' : '加入會員 (註冊)';
          document.getElementById('btn').innerText = isLoginMode ? '登入' : '註冊帳號';
          document.getElementById('toggleMode').innerText = isLoginMode ? '沒有帳號？切換到註冊' : '已有帳號？切換到登入';
        });

        document.getElementById('authForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.getElementById('username').value;
          const password = document.getElementById('password').value;
          const action = isLoginMode ? '/api/login' : '/api/register';

          // 🌟 修正：從目前網址抓取前端帶過來的 state 參數
          const urlParams = new URLSearchParams(window.location.search);
          const state = urlParams.get('state') || '';

          try {
            const res = await fetch(action, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (!res.ok) {
              alert(data.message);
              return;
            }

            alert(data.message);
            if (isLoginMode) {
              // 🌟 修正：登入成功後，直接導向本地的 callback 路由，帶上帳號和 state 去寫入 Cookie
              window.location.href = "/api/oauth/callback?username=" + encodeURIComponent(username) + "&state=" + encodeURIComponent(state);
            } else {
              document.getElementById('toggleMode').click();
            }
          } catch (err) {
            alert('連線失敗，請檢查後端是否開啟');
          }
        });
      </script>
    </body>
    </html>
  `);
});

// ==================== 路由 2：API 註冊 ====================
app.post('/api/register', async (req: Request, res: Response): Promise<any> => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ message: '請填寫帳號與密碼' });

  try {
    const [existingUser]: any = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (existingUser.length > 0) return res.status(400).json({ message: '此帳號已被註冊' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.execute('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);
    res.status(201).json({ message: '註冊成功！' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ==================== 路由 3：API 登入 ====================
app.post('/api/login', async (req: Request, res: Response): Promise<any> => {
  const { username, password } = req.body;
  try {
    const [users]: any = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    if (users.length === 0) return res.status(400).json({ message: '帳號或密碼錯誤' });

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(400).json({ message: '帳號或密碼錯誤' });

    res.json({ message: '驗證成功！' });
  } catch (error) {
    res.status(500).json({ message: '伺服器錯誤' });
  }
});

// ==================== 🌟 新增路由 4：在地化簡化版 OAuth Callback ====================
// 這個路由負責種下原本專案前端需要的 HttpOnly Cookie，並將你自動導向回管理後台
app.get("/api/oauth/callback", async (req: Request, res: Response): Promise<any> => {
  const username = req.query.username as string;
  const state = req.query.state as string;

  try {
    const [users]: any = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = users[0];

    // 製作帶有最高管理員權限的 Token 通行證
    const sessionToken = jwt.sign(
      { 
        openId: `local_${username}`, 
        userId: user ? user.id : 999,
        username: username,
        role: 'admin',      // 👈 強制前端認可你是管理員！
        isAdmin: true       // 👈 雙重保險身分標籤
      },
      process.env.JWT_SECRET || 'aa86853587',
      { expiresIn: '365d' } // 一年有效期限
    );

    // 🌟 關鍵：設定原本舊專案前端正在監聽的 HttpOnly Cookie 名稱
    res.cookie('app_session_id', sessionToken, {
      httpOnly: true,     // 防止前端 JS 竄改
      secure: false,      // 本地 localhost 開發改為 false，否則 http 協議會吃不到 Cookie
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    // 解析前端傳過來的 state 決定要重定向回哪裡
    let returnPath = '/admin'; // 預設直接進管理後台
    if (state) {
      try {
        const decodedState = JSON.parse(atob(state));
        returnPath = decodedState.returnPath || '/admin';
      } catch (e) {
        console.error("解析 state 失敗，將轉跳至預設後台");
      }
    }

    // 完美重定向，咻一聲飛回前端的 /admin 頁面！
    res.redirect(`http://localhost:5173${returnPath}`);

  } catch (error) {
    console.error(error);
    res.status(500).send('在地化 Callback 發生錯誤');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT} 成功開啟！`);
});