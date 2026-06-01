# BÁO CÁO CÁC LỖI ĐÃ ĐƯỢC KHẮC PHỤC TRÊN TOÀN BỘ HỆ THỐNG MINI-SOUNDCLOUD

Dưới đây là danh sách chi tiết các lỗi đã được tìm thấy và khắc phục thành công từ Giao diện người dùng (Frontend) đến Cơ sở dữ liệu phụ trợ (Backend) và Supabase.

---

## 1. Play Count Không Tăng (Khắc Phục 100%)
*   **Nguyên nhân:** Lỗi do hàm `increment_play_count` trong cơ sở dữ liệu Supabase được định nghĩa là một hàm RPC để tăng số lượt phát nhưng backend lại cố cập nhật thủ công cột `play_count` bằng phương thức `.update()` của Supabase Client mà không qua RPC. Điều này bị chặn bởi chính sách bảo mật RLS (Row Level Security) không cho phép người dùng tự sửa đổi số lượt phát.
*   **Tệp lỗi:** `mini-soundcloud-backend/src/routes/songs.js`
*   **Giải pháp:**
    *   Sử dụng lệnh gọi `rpc('increment_play_count', { song_id: id })` thay vì dùng `.update()`.
    *   Tự động lưu lịch sử nghe nhạc và tăng số lượt phát đồng bộ thông qua route `/api/songs/:id/play`.

---

## 2. Play History Không Được Ghi (Khắc Phục 100%)
*   **Nguyên nhân:**
    1.  *Lỗi DB (RLS):* Bảng `play_history` có cơ chế RLS (Row Level Security) được bật nhưng không có chính sách (Policy) nào cho phép thêm dữ liệu (`INSERT`). Do đó, bất kỳ yêu cầu ghi lịch sử nào từ API cũng bị Supabase chặn đứng (lỗi 401/403).
    2.  *Lỗi Server:* Đường dẫn `/api/songs/:id/play` bị lỗi cú pháp khi giải cấu trúc `req.user.id` thành `userId` nhưng lại dùng tên `id` dẫn đến giá trị `undefined`.
    3.  *Lỗi Client (Duplicate Playback Recording):* Do component cập nhật trạng thái liên tục, `play()` được gọi liên tiếp trong vòng vài mili-giây gây ra việc gửi 2-3 yêu cầu ghi lịch sử đồng thời lên backend cho cùng một bài hát.
*   **Tệp lỗi:**
    *   Cơ sở dữ liệu Supabase (bảng `play_history`)
    *   `mini-soundcloud-backend/src/routes/songs.js`
    *   `mini-soundcloud-app/src/context/PlayerContext.js`
*   **Giải pháp:**
    *   *Backend & Database:* Khởi tạo các chính sách RLS cho phép người dùng đăng nhập có quyền `INSERT` và `SELECT` lịch sử nghe của chính mình.
    *   *Backend Router:* Sửa lại cú pháp lấy `req.user.id` đúng chuẩn và tối ưu hóa hàm lưu lịch sử.
    *   *Frontend (Debounce Ghi Nhận):* Thêm cơ chế **Debounce** dựa trên ID bài hát và mốc thời gian (chỉ cho phép ghi nhận lượt phát mới nếu chuyển sang bài hát khác hoặc cách nhau ít nhất 5 giây). Tránh hoàn toàn việc ghi nhận lịch sử trùng lặp.

---

## 3. Trang Cá Nhân Hiển Thị 0 Lượt Nghe & Lịch Sử Trống (Khắc Phục 100%)
*   **Nguyên nhân:**
    1.  *Lỗi Endpoint API:* Client gọi `/api/users/profile` nhưng Backend Router của users không định nghĩa route này, hoặc trả về lỗi do thiếu middleware xác thực.
    2.  *Lỗi Thống Kê:* Backend tính tổng lượt phát từ lịch sử bằng cách đếm số dòng trong `play_history` thuộc về user. Vì lịch sử không được ghi (lỗi RLS ở trên) nên kết quả luôn là 0.
*   **Tệp lỗi:**
    *   `mini-soundcloud-backend/src/routes/users.js`
    *   `mini-soundcloud-app/src/screens/ProfileScreen.js`
*   **Giải pháp:**
    *   Khắc phục lỗi ghi lịch sử giúp hệ thống tích lũy dữ liệu chính xác.
    *   Bổ sung route `/api/users/profile` trong backend để trả về đầy đủ: thông tin tài khoản, danh sách bài hát đã đăng, lịch sử phát nhạc mới nhất, và tổng số lượt nghe (`totalPlays`) của người dùng.
    *   Cập nhật `ProfileScreen.js` hiển thị chính xác dữ liệu thực tế từ API.

---

## 4. Tương Thích Hoàn Hảo Với Expo SDK 54 & Expo Audio mới (Khắc Phục 100%)
*   **Nguyên nhân:** Gói thư viện cũ `expo-av` bị lỗi thời, gây ra lỗi nghiêm trọng trên các phiên bản Expo 54+ mới (`TypeError: Cannot read property 'Sound' of undefined` và `TypeError: Cannot read property 'setAudioModeAsync' of undefined`).
*   **Tệp lỗi:** `mini-soundcloud-app/src/context/PlayerContext.js`
*   **Giải pháp:**
    *   Chuyển đổi toàn bộ logic âm thanh từ `expo-av` sang gói thư viện chính thức mới nhất của Expo là `expo-audio`.
    *   Sử dụng hook `useAudioPlayer` và `useAudioPlayerStatus` để quản lý trình phát nhạc tự động giải phóng bộ nhớ khi tắt component.
    *   Sử dụng cấu hình toàn cục `setAudioModeAsync` thay thế hoàn toàn cho `useAudioMode` (không tồn tại trong expo-audio) để đảm bảo nhạc chạy mượt mà ngay cả khi khóa màn hình hoặc ứng dụng chạy nền trên iOS và Android.

---

## 5. Các Lỗi Nghiêm Trọng Khác Đã Tìm Thấy & Sửa Đổi
1.  **Lỗi FileSystem (Expo 54):** `UploadScreen.js` sử dụng import không tương thích `import * as FileSystem from 'expo-file-system'`. Đã được cập nhật sang cách import legacy `import FileSystem from 'expo-file-system'` để tránh lỗi crash khi chọn tệp âm thanh.
2.  **Lỗi ImagePicker (Expo 54):** `UploadScreen.js` sử dụng `MediaTypeOptions.Images` bị khai tử từ SDK 54. Đã được sửa thành `'images'` chuẩn xác.
3.  **Lỗi Giao Diện Trang Lịch Sử (`HistoryScreen.js`):** Sửa lỗi định dạng hiển thị thời gian phát nhạc từ số mili-giây sang ngày giờ đọc được (ví dụ: `15:30 01/06/2026`).

---

### Trạng Thái Hiện Tại Của Hệ Thống
Toàn bộ mã nguồn backend, frontend và cấu hình Supabase đã được kiểm tra, cập nhật và đồng bộ hóa. Hệ thống hoạt động trơn tru từ giao diện người dùng đến luồng dữ liệu phụ trợ.