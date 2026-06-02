# SHARED CONTRACT: TEAROOM EVENTS & CONTEXT INTERFACE

Tài liệu này là "Hợp đồng (Contract)" giữa Team UI (PWA Specialist) và Team Logic (Realtime Core). Cả 2 Agent BẮT BUỘC phải code theo đúng định dạng dưới đây.

## 1. REACT CONTEXT INTERFACE (`TearoomContext`)

Bên Logic phải export, và bên UI phải consume các state/functions sau từ `TearoomContext`:

```javascript
const {
  // States
  currentRoom,        // Object: { room_id, room_name, invite_code, host_user_id, max_members }
  isHost,             // Boolean: check user hiện tại có phải chủ phòng không
  members,            // Array: Danh sách user trong phòng
  chatMessages,       // Array: [{ id, user: { username, avatar }, content, sent_at }]
  queue,              // Array: Danh sách bài hát (JSONB array từ DB)
  roomPlaybackState,  // Object: { current_song_id, is_playing, current_time_ms }
  
  // Functions
  createRoom,         // async (name, maxMembers) => void
  joinRoom,           // async (inviteCode) => void
  leaveRoom,          // async () => void
  sendMessage,        // async (content) => void
  addToQueue,         // async (songId) => void
  reorderQueue,       // async (newQueueList) => void (Host only)
  syncPlaybackHost    // async (songId, timeMs, isPlaying) => void (Host only, emit mỗi 2 giây)
} = useContext(TearoomContext);