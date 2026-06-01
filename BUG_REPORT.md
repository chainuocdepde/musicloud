# 🐛 BUG REPORT - Mini SoundCloud

## 📋 SUMMARY
Phân tích toàn bộ hệ thống và tìm thấy **7 lỗi nghiêm trọng** gây ra các vấn đề:
- ❌ play_count không tăng
- ❌ play_history không được ghi
- ❌ Trang cá nhân hiển thị 0

---

## 🔴 BUG #1: ProfileScreen - Sai đường dẫn thuộc tính stats (CRITICAL)

**File:** `mini-soundcloud-app/src/screens/ProfileScreen.js`  
**Dòng:** 29-30

### Vấn đề:
Backend trả về stats nằm trong `response.user.stats`, nhưng code đang đọc từ `response.uploads_count` và `response.total_plays` (thiếu `.user.stats`).

### Backend response thực tế:
```json
{
  "success": true,
  "user": {
    "user_id": "...",
    "username": "...",
    "stats": {
      "uploads_count": 5,
      "total_plays": 100
    }
  }
}
```

### Code bị lỗi:
```javascript
setStats({
    uploads_count: response.uploads_count || 0,  // ❌ WRONG
    total_plays: response.total_plays || 0,       // ❌ WRONG
});
```

### Cách sửa:
```javascript
setStats({
    uploads_count: response.user.stats?.uploads_count || 0,  // ✅ CORRECT
    total_plays: response.user.stats?.total_plays || 0,       // ✅ CORRECT
});
```

**Tác động:** Đây là lý do chính trang cá nhân luôn hiển thị 0!

---

## 🔴 BUG #2: songs.js - Không cập nhật play_count trực tiếp (CRITICAL)

**File:** `mini-soundcloud-backend/src/routes/songs.js`  
**Dòng:** 204-243

### Vấn đề:
Endpoint `POST /api/songs/:song_id/play` chỉ INSERT vào `play_history` và dựa hoàn toàn vào database trigger để tăng `play_count`. Nếu trigger không hoạt động (chưa được tạo, bị xóa, hoặc bị chặn bởi RLS), `play_count` sẽ không bao giờ tăng.

### Code hiện tại:
```javascript
router.post('/:song_id/play', authenticate, async (req, res) => {
    // ... chỉ INSERT vào play_history
    const { error: insertError } = await supabase
        .from('play_history')
        .insert([{ user_id: userId, song_id: song_id, ... }]);
    
    // ❌ KHÔNG có UPDATE songs.play_count
});
```

### Cách sửa:
Thêm UPDATE trực tiếp vào `songs.play_count` để đảm bảo luôn được cập nhật:

```javascript
router.post('/:song_id/play', authenticate, async (req, res) => {
    try {
        const { song_id } = req.params;
        const userId = req.user.user_id;
        const { duration_listened_ms = 0, completed = false } = req.body;

        // 1. Insert vào play_history
        const { error: insertError } = await supabase
            .from('play_history')
            .insert([{
                user_id: userId,
                song_id: song_id,
                duration_listened_ms: duration_listened_ms,
                completed: completed
            }]);

        if (insertError) {
            throw insertError;
        }

        // 2. ✅ UPDATE play_count trực tiếp (không dựa vào trigger)
        const { error: updateError } = await supabase
            .from('songs')
            .update({ 
                play_count: supabase.raw('play_count + 1'),
                last_played: new Date().toISOString()
            })
            .eq('song_id', song_id);

        if (updateError) {
            console.error('Update play_count error:', updateError);
            // Không throw error để không làm gián đoạn flow
        }

        res.json({
            success: true,
            message: 'Đã ghi nhận lượt nghe'
        });
    } catch (error) {
        console.error('Record play error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi ghi nhận lượt nghe',
            error: error.message
        });
    }
});
```

**Tác động:** Đây là lý do chính `play_count` không tăng!

---

## 🔴 BUG #3: HistoryScreen - Sai tên alias join (CRITICAL)

**File:** `mini-soundcloud-app/src/screens/HistoryScreen.js`  
**Dòng:** 41, 51-63

### Vấn đề:
Backend query sử dụng `songs:song_id (...)` trong Supabase join. Kết quả trả về có key là `songs` (số nhiều), nhưng frontend đang dùng `item.song` (số ít).

### Backend query (users.js line 190-200):
```javascript
.select(`
    *,
    songs:song_id (
        song_id,
        title,
        artist,
        ...
    )
`)
```

### Code bị lỗi:
```javascript
const handlePlaySong = (item) => {
    play(item.song);  // ❌ undefined - should be item.songs
    navigation.navigate('Player');
};

<Text>{item.song?.title || 'Unknown'}</Text>  // ❌ always shows "Unknown"
<Text>{item.song?.artist || 'Unknown'}</Text> // ❌ always shows "Unknown"
```

### Cách sửa:
```javascript
const handlePlaySong = (item) => {
    play(item.songs);  // ✅ CORRECT
    navigation.navigate('Player');
};

<Text>{item.songs?.title || 'Unknown'}</Text>  // ✅ CORRECT
<Text>{item.songs?.artist || 'Unknown'}</Text> // ✅ CORRECT
```

**Tác động:** Lịch sử nghe hiển thị "Unknown" và không thể phát bài hát!

---

## 🔴 BUG #4: AdminPanel - Sai đường dẫn stats (IMPORTANT)

**File:** `mini-soundcloud-app/src/screens/AdminPanel.js`  
**Dòng:** 111

### Vấn đề:
Tương tự BUG #1, admin API trả về stats nằm trong `item.stats`, không phải `item.uploads_count`.

### Code bị lỗi:
```javascript
<Text style={styles.itemMeta}>
    {item.uploads_count || 0} bài đã đăng • Role: {item.role}  // ❌ WRONG
</Text>
```

### Cách sửa:
```javascript
<Text style={styles.itemMeta}>
    {item.stats?.uploads_count || 0} bài đã đăng • Role: {item.role}  // ✅ CORRECT
</Text>
```

---

## 🔴 BUG #5: ProgressBar - Seek không hoạt động (IMPORTANT)

**File:** `mini-soundcloud-app/src/components/ProgressBar.js`  
**Dòng:** 6-26

### Vấn đề:
1. `handlePress` được định nghĩa nhưng không bao giờ được gọi
2. `TouchableWithoutFeedback` được import nhưng không được sử dụng trong JSX
3. Hàm `handlePress` tính `locationX` nhưng không bao giờ gọi `onSeek`

### Code bị lỗi:
```javascript
const handlePress = (event) => {
    if (!duration || !onSeek) return;
    const { locationX } = event.nativeEvent;
    // ❌ Không làm gì cả!
};

return (
    <View style={styles.container}>
        <View style={styles.progressBarBg}>  {/* ❌ Không có touch handler */}
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        ...
    </View>
);
```

### Cách sửa:
Implement đầy đủ chức năng seek với `onLayout` để đo chính xác chiều rộng.

---

## 🔴 BUG #6: PlayerContext - Import không sử dụng

**File:** `mini-soundcloud-app/src/context/PlayerContext.js`  
**Dòng:** 3, 40-53

### Vấn đề:
`playbackAPI` được import và hàm `recordHistory` được định nghĩa nhưng không bao giờ được gọi. Hàm `play` gọi trực tiếp `songsAPI.recordPlay` thay vì dùng `recordHistory`.

### Code:
```javascript
import { playbackAPI, songsAPI } from '../services/api';  // playbackAPI không dùng

const recordHistory = useCallback(async (song) => {
    // ... hàm này không bao giờ được gọi
    await playbackAPI.recordHistory({ ... });
}, []);

const play = useCallback(async (song, playlistQueue = []) => {
    // ...
    await songsAPI.recordPlay(song.song_id, 0, false);  // Gọi trực tiếp thay vì dùng recordHistory
}, []);
```

### Cách sửa:
Xóa import `playbackAPI` và hàm `recordHistory` không dùng, hoặc refactor để sử dụng nó.

---

## 🔴 BUG #7: Database Trigger - Có thể bị chặn bởi RLS

**File:** `OpenedSpec/databasesupabase.md`  
**Dòng:** 193-206

### Vấn đề:
Trigger `increment_play_count` được tạo mà không có `SECURITY DEFINER`, nghĩa là nó chạy với quyền của user gọi (SECURITY INVOKER). Nếu backend không dùng service role key đúng cách, trigger có thể bị chặn bởi RLS policy trên bảng `songs`.

### Trigger hiện tại:
```sql
CREATE OR REPLACE FUNCTION increment_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE songs
  SET play_count  = play_count + 1,
      last_played = NOW()
  WHERE song_id = NEW.song_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;  -- ❌ Thiếu SECURITY DEFINER
```

### Cách sửa:
```sql
CREATE OR REPLACE FUNCTION increment_play_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE songs
  SET play_count  = play_count + 1,
      last_played = NOW()
  WHERE song_id = NEW.song_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;  -- ✅ Thêm SECURITY DEFINER
```

**Lưu ý:** Với BUG #2 đã được sửa (UPDATE trực tiếp trong backend), trigger này trở thành backup mechanism.

---

## 📊 TÓM TẮT TÁC ĐỘNG

| Bug | File | Tác động | Mức độ |
|-----|------|----------|--------|
| #1 | ProfileScreen.js | Trang cá nhân luôn hiển thị 0 | 🔴 CRITICAL |
| #2 | songs.js | play_count không tăng | 🔴 CRITICAL |
| #3 | HistoryScreen.js | Lịch sử không hiển thị đúng | 🔴 CRITICAL |
| #4 | AdminPanel.js | Admin panel hiển thị sai | 🟡 IMPORTANT |
| #5 | ProgressBar.js | Không thể seek trong bài hát | 🟡 IMPORTANT |
| #6 | PlayerContext.js | Code không sạch | 🟢 MINOR |
| #7 | Database | Trigger có thể fail | 🟡 IMPORTANT |

---

## ✅ CÁCH KHẮC PHỤC

Tôi sẽ sửa tất cả các file bị lỗi trong các bước tiếp theo.