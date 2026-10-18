# H

Nền tảng học trực tuyến cho học sinh tiểu học, tổ chức thành hai ứng dụng độc lập:

- `src/` — client React + Vite.
- `server/` — REST API Express + MongoDB + Socket.IO.

## Chạy client

```bash
npm install
npm run dev
```

## Chạy server

```bash
cd server
copy .env.example .env
npm install
npm run dev
```

Tạo MongoDB local hoặc thay `MONGODB_URI` bằng connection string MongoDB Atlas trước khi chạy server.

## Phân hệ giao diện

- Học sinh: `/student`, `/student/map`, `/student/lesson`, `/student/achievements`
- Phụ huynh: `/parent`, `/parent/settings`
- Giáo viên: `/teacher`, `/teacher/questions`, `/teacher/assignments`, `/teacher/settings`
- Quản trị viên: `/admin`, `/admin/users`, `/admin/settings`

API có các module `auth`, `users`, `lessons`, `questions`, `assignments` và `progress`. JWT access token được trả về trong response; refresh token nằm trong HTTP-only cookie.
