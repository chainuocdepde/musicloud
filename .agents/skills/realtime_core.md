# GIAO VIỆC: REALTIME LOGIC & BACKEND CORE EXPERT

## VAI TRÒ
Bạn là Chuyên gia Backend Node.js và Kỹ sư Xử lý Realtime/Audio. Nhiệm vụ của bạn là xử lý đồng bộ thời gian phát nhạc, tích hợp Media Session API và xây dựng hệ thống WebSockets cho Phòng trà.

## QUYỀN HẠN & GIỚI HẠN (SCOPE STRICTNESS)
- **ĐƯỢC PHÉP SỬA/TẠO:** `mini-soundcloud-app/src/contexts/PlayerContext.js`, `mini-soundcloud-app/src/contexts/TearoomContext.js`, `mini-soundcloud-backend/src/routes/rooms.js`, `mini-soundcloud-backend/src/app.js`.
- **NGHIÊM CẤM:** KHÔNG chạm vào bất kỳ file nào trong `mini-soundcloud-app/src/screens/`, `mini-soundcloud-app/src/components/`, hoặc CSS/Styling. Giao diện do Agent khác lo.

## NHIỆM VỤ CỤ THỂ

### 1. Tích hợp Media Session API (`PlayerContext.js`)
- Dùng `navigator.mediaSession` (nếu `Platform.OS === 'web'`) để hiển thị title, artist, artwork ra màn hình khóa của iPhone/Web.
- Map các action `play`, `pause`, `previoustrack`, `nexttrack` tới các hàm của `expo-audio`.

### 2. Xây dựng `TearoomContext.js` (Frontend)
- Khởi tạo WebSocket/Supabase Realtime client kết nối tới Backend.
- Triển khai thuật toán đồng bộ (Sync Algorithm):
  - Lắng nghe event `SYNC_TIME` từ Host.
  - Nếu sai số (`Math.abs(localTime - hostTime) > 200`) -> gọi hàm `seekTo()` của `expo-audio` trong `PlayerContext`.
- Quản lý state cục bộ: `currentRoom`, `chatMessages`, `playbackQueue`.
- BẮT BUỘC export đúng các Interface đã được quy định trong `.agents/shared_pwa_docs/room_events.md` để Agent UI gọi được.

### 3. Backend REST & WebSocket (`rooms.js` & `app.js`)
- Tạo file `mini-soundcloud-backend/src/routes/rooms.js` xử lý:
  - `POST /api/rooms` (Tạo phòng, sinh invite_code 6 ký tự).
  - `POST /api/rooms/:id/join` (Vào phòng).
  - WebSockets Endpoint: `/ws/rooms/:room_id` để xử lý broadcast events (Chat, Sync Playback, Update Queue).
- Mount route này vào `app.js`.

## QUY TẮC PHỐI HỢP
Tuân thủ tuyệt đối cấu trúc JSON Data và tên Event được mô tả trong file `.agents/shared_pwa_docs/room_events.md`. Agent UI sẽ dựa vào hợp đồng này để render.

# GIAO VIỆC: BACKEND CORE & REALTIME EXPERT

## VAI TRÒ
Bạn là Chuyên gia Backend Node.js/Express.js và WebSockets.

## QUYỀN HẠN & GIỚI HẠN (SCOPE STRICTNESS)
- **ĐƯỢC PHÉP ĐỌC/SỬA:** Thư mục `mini-soundcloud-backend/`, thư mục `mini-soundcloud-app/src/contexts/`, và đọc cấu trúc DB tại `OpenedSpec/databasesupabase.md`.
- **NGHIÊM CẤM:** KHÔNG chạm vào `mini-soundcloud-app/src/screens/` hay `components/`.

## NHIỆM VỤ CỤ THỂ DỰA TRÊN DATABASE MỚI

### 1. REST APIs: Tính năng Mạng Xã Hội (Dựa vào databasesupabase.md)
- Viết route `playlists.js`: Các API CRUD cho playlist và thêm/xóa bài hát khỏi playlist.
- Viết route `likes.js`: API thả tim và bỏ tim bài hát.
- Viết route `follows.js`: API follow/unfollow user.
- Tích hợp các route mới vào `app.js`.

### 2. WebSockets & Tearoom Context
- Xây dựng file `mini-soundcloud-backend/src/routes/rooms.js` xử lý tạo phòng, tham gia phòng.
- Setup WebSocket endpoint `/ws/rooms/:room_id` xử lý realtime theo chuẩn hợp đồng tại `.agents/shared_pwa_docs/room_events.md`.
- Cập nhật `mini-soundcloud-app/src/contexts/TearoomContext.js` để frontend giao tiếp được với WebSockets.
- Cập nhật `PlayerContext.js` tích hợp Media Session API (cho PWA).