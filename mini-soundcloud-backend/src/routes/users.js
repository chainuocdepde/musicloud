const express = require('express');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

router.get('/:user_id', authenticate, async (req, res) => {
    try {
        const { user_id } = req.params;

        const { data: user, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (userError) {
            if (userError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }
            throw userError;
        }

        const { count: uploadsCount, error: uploadsError } = await supabase
            .from('songs')
            .select('song_id', { count: 'exact', head: true })
            .eq('uploaded_by_id', user_id);

        if (uploadsError) {
            throw uploadsError;
        }

        const { data: playsData, error: playsError } = await supabase
            .from('songs')
            .select('play_count')
            .eq('uploaded_by_id', user_id);

        if (playsError) {
            throw playsError;
        }

        const totalPlays = playsData ? playsData.reduce((sum, song) => sum + (song.play_count || 0), 0) : 0;

        const userResponse = {
            user_id: user.user_id,
            username: user.username,
            email: user.email,
            avatar_url: user.avatar_url,
            role: user.role,
            created_at: user.created_at,
            stats: {
                uploads_count: uploadsCount,
                total_plays: totalPlays
            }
        };

        res.json({
            success: true,
            user: userResponse
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thông tin người dùng',
            error: error.message
        });
    }
});

router.put('/:user_id', authenticate, async (req, res) => {
    try {
        const { user_id } = req.params;
        const currentUserId = req.user.user_id;

        if (user_id !== currentUserId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn chỉ có thể sửa thông tin tài khoản của mình'
            });
        }

        const { username, avatar_url } = req.body;

        const updateData = {};
        if (username !== undefined) {
            if (username.length < 3 || username.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: 'Username phải từ 3-50 ký tự'
                });
            }
            updateData.username = username;
        }
        if (avatar_url !== undefined) {
            updateData.avatar_url = avatar_url;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Không có dữ liệu để cập nhật'
            });
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update(updateData)
            .eq('user_id', user_id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        const userResponse = {
            user_id: updatedUser.user_id,
            username: updatedUser.username,
            email: updatedUser.email,
            avatar_url: updatedUser.avatar_url,
            role: updatedUser.role,
            created_at: updatedUser.created_at
        };

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công',
            user: userResponse
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi cập nhật thông tin',
            error: error.message
        });
    }
});

router.get('/:user_id/uploads', authenticate, async (req, res) => {
    try {
        const { user_id } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const offset = parseInt(req.query.offset) || 0;

        const { data: songs, error: songsError, count } = await supabase
            .from('songs')
            .select('*', { count: 'exact' })
            .eq('uploaded_by_id', user_id)
            .order('uploaded_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (songsError) {
            throw songsError;
        }

        res.json({
            success: true,
            songs: songs || [],
            total: count || 0
        });
    } catch (error) {
        console.error('Get user uploads error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách bài hát của người dùng',
            error: error.message
        });
    }
});

router.get('/:user_id/history', authenticate, async (req, res) => {
    try {
        const { user_id } = req.params;
        const currentUserId = req.user.user_id;
        const userRole = req.user.role;
        const limit = parseInt(req.query.limit) || 50;

        if (user_id !== currentUserId && userRole !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xem lịch sử của người dùng này'
            });
        }

        const { data: history, error: historyError } = await supabase
            .from('play_history')
            .select(`
                *,
                songs:song_id (
                    song_id,
                    title,
                    artist,
                    cover_url,
                    duration_ms,
                    audio_url,
                    uploaded_by_name
                )
            `)
            .eq('user_id', user_id)
            .order('played_at', { ascending: false })
            .limit(limit);

        if (historyError) {
            throw historyError;
        }

        res.json({
            success: true,
            history: history || []
        });
    } catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử nghe',
            error: error.message
        });
    }
});

module.exports = router;