# Setup Instructions - Forgot Password & Facebook OAuth2

## 1. Database Migration (Supabase)

Run the SQL commands in `database_migration.sql` in your Supabase SQL Editor to add password reset functionality:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP;
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token) WHERE reset_token IS NOT NULL;
```

## 2. Environment Variables

Update your `.env` file with the following credentials:

### Email Configuration (for password reset emails)
- `EMAIL_USER`: Your Gmail address (already configured: truongconggiabao86@gmail.com)
- `EMAIL_PASSWORD`: Your Gmail app password (already configured)
- `FRONTEND_URL`: Your frontend URL (default: http://localhost:3000)

### Facebook OAuth2 Configuration
You need to create a Facebook App and get credentials:

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add "Facebook Login" product
4. Configure OAuth redirect URIs
5. Get your App ID and App Secret

Update these in `.env`:
```
FACEBOOK_CLIENT_ID=your_facebook_app_id_here
FACEBOOK_CLIENT_SECRET=your_facebook_app_secret_here
```

## 3. New API Endpoints

### Forgot Password
**POST** `/api/auth/forgot-password`

Request body:
```json
{
  "email": "user@example.com"
}
```

Response:
```json
{
  "success": true,
  "message": "Email đặt lại mật khẩu đã được gửi"
}
```

### Reset Password
**POST** `/api/auth/reset-password`

Request body:
```json
{
  "token": "reset_token_from_email",
  "new_password": "newpassword123"
}
```

Response:
```json
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công"
}
```

### Facebook OAuth2 Login
**POST** `/api/auth/facebook`

Request body:
```json
{
  "access_token": "facebook_access_token"
}
```

Response:
```json
{
  "success": true,
  "user": { ... },
  "token": "jwt_token",
  "refresh_token": "refresh_token",
  "is_new_user": false
}
```

## 4. Frontend Integration

### Forgot Password Flow
1. User enters email on forgot password page
2. Frontend calls `/api/auth/forgot-password`
3. User receives email with reset link
4. User clicks link (contains token in URL)
5. Frontend shows reset password form
6. Frontend calls `/api/auth/reset-password` with token and new password

### Facebook Login Flow
1. Use Facebook SDK to get access token
2. Send access token to `/api/auth/facebook`
3. Receive JWT token and user data
4. Store token for authenticated requests

## 5. Testing

### Test Forgot Password
```bash
# Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Reset password (use token from email)
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"TOKEN_FROM_EMAIL","new_password":"newpass123"}'
```

### Test Facebook Login
```bash
curl -X POST http://localhost:3000/api/auth/facebook \
  -H "Content-Type: application/json" \
  -d '{"access_token":"FACEBOOK_ACCESS_TOKEN"}'
```

## 6. Security Notes

- Reset tokens expire after 1 hour
- Tokens are single-use (cleared after password reset)
- Email sending uses Gmail SMTP (already configured)
- Password must be at least 8 characters
- Facebook login requires email permission

## 7. Restart Server

After making these changes, restart your backend server:

```bash
cd mini-soundcloud-backend
npm start
# or for development
npm run dev
```
