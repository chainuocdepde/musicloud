const express = require('express');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.post('/history', authenticate, async (req, res) => {
    try {
        const { song_id, duration_listened_ms, completed } = req.body;
        const userId = req.user.user_id;

        if (!song_id) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu song_id'
            });
        }

        const { data: song, error: songError } = await supabase
            .from('songs')
            .select('song_id')
            .eq('song_id', song_id)
            .single();

        if (songError) {
            if (songError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy bài hát'
                });
            }
            throw songError;
        }

        const { data: history, error: insertError } = await supabase
            .from('play_history')
            .insert([
                {
                    user_id: userId,
                    song_id: song_id,
                    duration_listened_ms: duration_listened_ms || 0,
                    completed: completed || false
                }
            ])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        res.json({
            success: true,
            message: 'Đã ghi lại lịch sử nghe'
        });
    } catch (error) {
        console.error('Record history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi ghi lại lịch sử nghe',
            error: error.message
        });
    }
});

module.exports = router;