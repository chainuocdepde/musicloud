# 🚨 URGENT: Duplicate Play History Bug Analysis

## Problem
System inserts 2 identical play_history records every time a song is played.

## Root Cause Analysis

### ✅ FOUND: The Bug is in PlayerContext.js

**File:** `mini-soundcloud-app/src/context/PlayerContext.js`  
**Lines:** 55-97 (play function)

### The Problem:

```javascript
const play = useCallback(async (song, playlistQueue = []) => {
    try {
        // ... sound setup code ...
        
        // Line 76-82: Records play ONCE here
        console.log(`🎵 Playing song: ${song.song_id} - ${song.title}`);
        try {
            const recordResult = await songsAPI.recordPlay(song.song_id, 0, false);
            console.log(`✅ Play recorded:`, recordResult);
        } catch (error) {
            console.error(`❌ Record play error:`, error);
        }

        // Line 84-93: Sets up playback status listener
        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
                setCurrentTime(status.positionMillis);
                setDuration(status.durationMillis);

                if (status.didJustFinish) {
                    handleSongEnd();  // This is fine
                }
            }
        });
    } catch (error) {
        console.error('Play error:', error);
    }
}, []);
```

### Why Duplicates Occur:

**Scenario 1: React StrictMode (Development)**
- In development, React StrictMode causes useCallback to run twice
- The `play` function gets called twice
- Each call records a play → 2 records

**Scenario 2: Component Re-renders**
- If parent component re-renders and passes new `play` function reference
- Child components might call it multiple times
- Each call records a play → multiple records

**Scenario 3: User Interaction**
- User clicks play button multiple times quickly
- Each click calls `play()` → multiple records

## Solutions

### Solution 1: Add Deduplication in Backend (RECOMMENDED)

**File:** `mini-soundcloud-backend/src/routes/songs.js`  
**Lines:** 204-255

Add 5-second deduplication window:

```javascript
router.post('/:song_id/play', authenticate, async (req, res) => {
    try {
        const { song_id } = req.params;
        const userId = req.user.user_id;
        const { duration_listened_ms = 0, completed = false } = req.body;

        console.log(`[${new Date().toISOString()}] 🎵 Recording play for song: ${song_id}, user: ${userId}`);

        // ✅ CHECK FOR DUPLICATE: Same user, same song within 5 seconds
        const fiveSecondsAgo = new Date(Date.now() - 5000).toISOString();
        
        const { data: recentPlay, error: checkError } = await supabase
            .from('play_history')
            .select('history_id, played_at')
            .eq('user_id', userId)
            .eq('song_id', song_id)
            .gte('played_at', fiveSecondsAgo)
            .order('played_at', { ascending: false })
            .limit(1)
            .single();

        if (recentPlay && !checkError) {
            console.log(`[${new Date().toISOString()}] ⚠️ Duplicate play detected, skipping insert`);
            return res.json({
                success: true,
                message: 'Đã ghi nhận lượt nghe (duplicate skipped)',
                duplicate: true
            });
        }

        // Record play history
        const { error: insertError } = await supabase
            .from('play_history')
            .insert([
                {
                    user_id: userId,
                    song_id: song_id,
                    duration_listened_ms: duration_listened_ms,
                    completed: completed
                }
            ]);

        if (insertError) {
            console.error(`[${new Date().toISOString()}] ❌ Error inserting play history:`, insertError);
            throw insertError;
        }

        console.log(`[${new Date().toISOString()}] ✅ Play recorded successfully`);

        // Update play_count directly (don't rely on RPC)
        const { error: updateError } = await supabase
            .from('songs')
            .update({ 
                play_count: supabase.raw('play_count + 1'),
                last_played: new Date().toISOString()
            })
            .eq('song_id', song_id);

        if (updateError) {
            console.error(`[${new Date().toISOString()}] ⚠️ Update play_count error:`, updateError);
        } else {
            console.log(`[${new Date().toISOString()}] ✅ Play count incremented`);
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

### Solution 2: Add Debouncing in Frontend

**File:** `mini-soundcloud-app/src/context/PlayerContext.js`  
**Lines:** 55-97

Add debouncing to prevent multiple calls:

```javascript
const lastPlayRecordRef = useRef({ song_id: null, timestamp: 0 });

const play = useCallback(async (song, playlistQueue = []) => {
    try {
        if (soundRef.current) {
            await soundRef.current.unloadAsync();
        }

        const { sound } = await Audio.Sound.createAsync(
            { uri: song.audio_url },
            { shouldPlay: true }
        );

        soundRef.current = sound;
        setCurrentSong(song);
        setIsPlaying(true);
        historyRecordedRef.current = false;

        if (playlistQueue.length > 0) {
            setQueue(playlistQueue);
        }

        // ✅ DEBOUNCE: Only record if different song OR 5+ seconds passed
        const now = Date.now();
        const lastRecord = lastPlayRecordRef.current;
        const shouldRecord = 
            lastRecord.song_id !== song.song_id || 
            (now - lastRecord.timestamp) > 5000;

        if (shouldRecord) {
            console.log(`🎵 Playing song: ${song.song_id} - ${song.title}`);
            try {
                const recordResult = await songsAPI.recordPlay(song.song_id, 0, false);
                console.log(`✅ Play recorded:`, recordResult);
                
                // Update last record timestamp
                lastPlayRecordRef.current = {
                    song_id: song.song_id,
                    timestamp: now
                };
            } catch (error) {
                console.error(`❌ Record play error:`, error);
            }
        } else {
            console.log(`⚠️ Skipping duplicate play record (within 5 seconds)`);
        }

        sound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded) {
                setCurrentTime(status.positionMillis);
                setDuration(status.durationMillis);

                if (status.didJustFinish) {
                    handleSongEnd();
                }
            }
        });
    } catch (error) {
        console.error('Play error:', error);
    }
}, []);
```

### Solution 3: Database Unique Constraint (NUCLEAR OPTION)

Add unique constraint to prevent duplicates at database level:

```sql
-- This would prevent ANY duplicate within time window
-- But might be too restrictive
CREATE UNIQUE INDEX idx_play_history_unique_recent 
ON play_history (user_id, song_id, (played_at::date), (EXTRACT(HOUR FROM played_at)));
```

## Recommended Approach

**Implement BOTH Solution 1 AND Solution 2:**

1. **Backend deduplication** (Solution 1) - Primary defense
   - Catches duplicates from any source
   - Works even if frontend changes
   - Provides audit trail in logs

2. **Frontend debouncing** (Solution 2) - Secondary defense
   - Reduces unnecessary API calls
   - Improves performance
   - Better user experience

## Additional Checks

### Check for React StrictMode

**File:** `mini-soundcloud-app/App.js`

Look for:
```javascript
<React.StrictMode>
  <App />
</React.StrictMode>
```

If present, this causes double-rendering in development (but not production).

### Check for Multiple Event Listeners

The current code is SAFE - only one `setOnPlaybackStatusUpdate` listener per sound object.

## Implementation Priority

1. ✅ **IMMEDIATE**: Implement backend deduplication (Solution 1)
2. ✅ **HIGH**: Add frontend debouncing (Solution 2)
3. ⚠️ **OPTIONAL**: Add database constraint (Solution 3) - only if still seeing issues

## Testing

After implementing fixes, test:
1. Play same song multiple times quickly
2. Play song, pause, play again within 5 seconds
3. Switch between songs rapidly
4. Check play_history table for duplicates
5. Verify play_count increments correctly