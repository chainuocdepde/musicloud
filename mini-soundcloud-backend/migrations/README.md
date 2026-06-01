# Migration Guide: Add User Status Feature

## Tổng quan
Migration này thêm chức năng enable/disable user accounts vào hệ thống.

## Các thay đổi đã implement

### 1. Frontend (React Native App)
- **SearchScreen**: Đổi sang filter real-time giống AdminScreen (không gọi API mỗi lần gõ)
- **AdminScreen**: Thêm Toggle Switch để enable/disable user
  - Toggle ON (màu xanh #34C759) = User hoạt động
  - Toggle OFF (màu xám #8E8E93) = User bị vô hiệu hóa
  - Hiển thị status badge (Active/Disabled)
- **API Constants**: Thêm endpoint `TOGGLE_USER_STATUS`

### 2. Backend (Node.js + Express)
- **Admin Routes**: 
  - Thêm endpoint `PATCH /admin/users/:id/status` để toggle user status
  - Cập nhật `GET /admin/users` để include field `is_active`
- **Auth Routes**: Thêm check user status khi login
  - POST /login: Check is_active trước khi generate token
  - POST /google: Check is_active cho existing users
  - POST /discord: Check is_active cho existing users
  - POST /facebook: Check is_active cho existing users
  - User bị disable sẽ nhận HTTP 403 với message "Tài khoản của bạn đã bị vô hiệu hóa"

### 3. Database
- Thêm column `is_active` vào table `users`
- Default value: TRUE (tất cả users hiện tại sẽ active)
- Index được tạo để optimize query performance

## Cách chạy migration

### Bước 1: Chạy SQL Migration
1. Mở Supabase Dashboard
2. Vào SQL Editor
3. Copy nội dung file `migrations/add_user_is_active.sql`
4. Paste vào SQL Editor và chạy

Hoặc sử dụng Supabase CLI:
```bash
cd mini-soundcloud-backend
supabase db push migrations/add_user_is_active.sql
```

### Bước 2: Restart Backend Server
```bash
cd mini-soundcloud-backend
npm restart
```

### Bước 3: Rebuild React Native App
```bash
cd mini-soundcloud-app
npm start
```

## Testing

### Test 1: Toggle User Status (Admin)
1. Login với admin account
2. Vào Admin Panel
3. Chọn tab "Users"
4. Toggle switch của một user
5. Verify status badge thay đổi (Active ↔ Disabled)

### Test 2: Disabled User Cannot Login
1. Disable một user từ Admin Panel
2. Logout
3. Thử login với user đã bị disable
4. Verify nhận được error message: "Tài khoản của bạn đã bị vô hiệu hóa"

### Test 3: Search Real-time Filter
1. Vào Search tab
2. Gõ tên bài hát
3. Verify kết quả filter ngay lập tức (không có delay)
4. Verify suggestions dropdown hiển thị đúng

## Rollback (nếu cần)

Nếu cần rollback migration:
```sql
-- Remove is_active column
ALTER TABLE users DROP COLUMN IF EXISTS is_active;

-- Remove index
DROP INDEX IF EXISTS idx_users_is_active;
```

## Notes
- Admin không thể disable chính mình
- Admin không thể delete chính mình
- User bị disable vẫn tồn tại trong database (không bị xóa)
- User bị disable không thể login bằng bất kỳ phương thức nào (password, Google, Discord, Facebook)
