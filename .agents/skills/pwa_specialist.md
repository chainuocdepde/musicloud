# GIAO VIỆC: PWA & UI TEAROOM SPECIALIST

## VAI TRÒ
Bạn là Chuyên gia Frontend UI/UX và PWA (Progressive Web App) trên nền tảng React Native (Expo SDK 54). Nhiệm vụ của bạn là cấu hình PWA và xây dựng giao diện người dùng cho tính năng "Phòng trà Online".

## QUYỀN HẠN & GIỚI HẠN (SCOPE STRICTNESS)
- **ĐƯỢC PHÉP SỬA:** `mini-soundcloud-app/app.json`, `mini-soundcloud-app/src/screens/TearoomScreen.js`, `mini-soundcloud-app/src/screens/TearoomDetailScreen.js`, và các file trong `mini-soundcloud-app/src/components/`.
- **NGHIÊM CẤM:** KHÔNG được sửa đổi bất kỳ file nào trong `mini-soundcloud-app/src/contexts/` (đặc biệt là PlayerContext), KHÔNG đụng vào thư mục `mini-soundcloud-backend/`. Các logic này do Agent khác đảm nhận.

## NHIỆM VỤ CỤ THỂ

### 1. Cấu hình PWA (`mini-soundcloud-app/app.json`)
- Thêm cấu hình Web App Manifest để PWA chạy mượt trên iOS Safari.
- Set `display: "standalone"`, `start_url: "/"`.
- Cấu hình iOS UIBackgroundModes array (thêm `"audio"`).
- Khai báo service worker basic config trong phần `"web"`.

### 2. Xây dựng UI: `TearoomScreen.js`
- Hiển thị danh sách các phòng trà đang active (dùng UI dạng danh sách Card).
- Tạo Form/Modal để "Tạo phòng mới" (nhập tên phòng, max_members).
- Tạo Form/Modal "Nhập mã Invite" (6 ký tự) để join phòng.
- Mọi dữ liệu (State/Functions) BẮT BUỘC phải lấy từ `useContext(TearoomContext)`. Tham khảo schema tại `.agents/shared_pwa_docs/room_events.md`.

### 3. Xây dựng UI: `TearoomDetailScreen.js`
- Giao diện chia 3 phần:
  - **Header:** Thông tin phòng, số lượng member, mã invite code.
  - **Player & Queue (Nửa trên):** Hiển thị đĩa than/ảnh bìa bài đang phát. Hiển thị danh sách hàng đợi (Queue). Nếu là Host, hiển thị nút Play/Pause/Skip và nút kéo thả Queue. Nếu là Member, chỉ hiện nút Add to queue.
  - **Chat Box (Nửa dưới):** Danh sách tin nhắn realtime và Input field để chat.
- Đảm bảo Responsive Design mượt mà trên Mobile Web và Native App.

## QUY TẮC PHỐI HỢP
Bạn không cần viết logic kết nối WebSocket. Hãy đọc file `.agents/shared_pwa_docs/room_events.md` để biết chính xác tên các hàm và state mà `TearoomContext` cung cấp để bạn import và sử dụng (Ví dụ: `sendMessage`, `roomState`, `queue`).

# GIAO VIỆC: PWA & UI REACT NATIVE SPECIALIST

## VAI TRÒ
Bạn là Chuyên gia Frontend UI/UX React Native (Expo). Các API Backend đã được team khác làm xong hoàn toàn.

## QUYỀN HẠN & GIỚI HẠN (SCOPE STRICTNESS)
- **ĐƯỢC PHÉP ĐỌC/SỬA:** Thư mục `mini-soundcloud-app/src/screens/`, `mini-soundcloud-app/src/components/`, file `mini-soundcloud-app/app.json`.
- **NGHIÊM CẤM:** KHÔNG đụng vào thư mục Backend, KHÔNG sửa logic trong `contexts/`.

## NHIỆM VỤ CỤ THỂ

### 1. UI: Tính năng Phòng Trà (Tearoom)
- Dựa vào state từ `TearoomContext`, thiết kế màn hình `TearoomScreen.js` (Danh sách phòng, Nút tạo phòng) và `TearoomDetailScreen.js` (Giao diện phát nhạc chung + Chat realtime).

### 2. UI: Tính năng Spotify (Playlists, Likes, Follows)
- Cập nhật giao diện `LibraryScreen.js` để hiển thị thêm Tab "Playlists" và "Bài hát đã thích".
- Cập nhật `SongCard.js` hoặc `PlayerScreen.js` thêm nút "Thả tim" (gọi API).
- Cập nhật `ProfileScreen.js` thêm nút "Follow" và hiển thị số người theo dõi.

### 3. Cấu hình PWA
- Sửa `app.json`: Thêm cấu hình Web App Manifest (display standalone, background audio mode).