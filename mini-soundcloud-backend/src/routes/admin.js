const express = require('express');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');

const router = express.Router();

router.get('/users', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (usersError) {
            throw usersError;
        }

        const usersWithStats = await Promise.all(
            users.map(async (user) => {
                const { data: uploadsData } = await supabase
                    .from('songs')
                    .select('song_id')
                    .eq('uploaded_by_id', user.user_id);

                const uploadsCount = uploadsData ? uploadsData.length : 0;

                const { data: playsData } = await supabase
                    .from('songs')
                    .select('play_count')
                    .eq('uploaded_by_id', user.user_id);

                const totalPlays = playsData ? playsData.reduce((sum, song) => sum + (song.play_count || 0), 0) : 0;

                return {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    avatar_url: user.avatar_url,
                    role: user.role,
                    auth_method: user.auth_method,
                    is_active: user.is_active !== false, // Default to true if not set
                    created_at: user.created_at,
                    uploads_count: uploadsCount,
                    stats: {
                        uploads_count: uploadsCount,
                        total_plays: totalPlays
                    }
                };
            })
        );

        res.json({
            success: true,
            users: usersWithStats
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách người dùng',
            error: error.message
        });
    }
});

router.delete('/users/:user_id', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { user_id } = req.params;
        const currentUserId = req.user.user_id;

        if (user_id === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'Không thể xóa chính mình'
            });
        }

        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }
            throw findError;
        }

        const { data: userSongs, error: songsError } = await supabase
            .from('songs')
            .select('*')
            .eq('uploaded_by_id', user_id);

        if (songsError) {
            throw songsError;
        }

        if (userSongs && userSongs.length > 0) {
            for (const song of userSongs) {
                if (song.audio_url) {
                    const audioPath = song.audio_url.split('/songs/')[1];
                    if (audioPath) {
                        await supabase.storage.from('songs').remove([audioPath]);
                    }
                }

                if (song.cover_url) {
                    const coverPath = song.cover_url.split('/covers/')[1];
                    if (coverPath) {
                        await supabase.storage.from('covers').remove([coverPath]);
                    }
                }
            }

            const { error: deleteSongsError } = await supabase
                .from('songs')
                .delete()
                .eq('uploaded_by_id', user_id);

            if (deleteSongsError) {
                throw deleteSongsError;
            }
        }

        const { error: deleteHistoryError } = await supabase
            .from('play_history')
            .delete()
            .eq('user_id', user_id);

        if (deleteHistoryError) {
            console.error('Delete history error:', deleteHistoryError);
        }

        const { error: deleteDownloadsError } = await supabase
            .from('offline_downloads')
            .delete()
            .eq('user_id', user_id);

        if (deleteDownloadsError) {
            console.error('Delete downloads error:', deleteDownloadsError);
        }

        const { error: deleteUserError } = await supabase
            .from('users')
            .delete()
            .eq('user_id', user_id);

        if (deleteUserError) {
            throw deleteUserError;
        }

        res.json({
            success: true,
            message: 'Xóa người dùng thành công'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa người dùng',
            error: error.message
        });
    }
});

router.patch('/users/:user_id/status', authenticate, authorize('admin'), async (req, res) => {
    try {
        const { user_id } = req.params;
        const { is_active } = req.body;
        const currentUserId = req.user.user_id;

        if (user_id === currentUserId) {
            return res.status(400).json({
                success: false,
                message: 'Không thể thay đổi trạng thái của chính mình'
            });
        }

        if (typeof is_active !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'is_active phải là boolean'
            });
        }

        const { data: user, error: findError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', user_id)
            .single();

        if (findError) {
            if (findError.code === 'PGRST116') {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy người dùng'
                });
            }
            throw findError;
        }

        const { data: updatedUser, error: updateError } = await supabase
            .from('users')
            .update({ is_active })
            .eq('user_id', user_id)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        res.json({
            success: true,
            message: is_active ? 'Đã kích hoạt người dùng' : 'Đã vô hiệu hóa người dùng',
            user: {
                user_id: updatedUser.user_id,
                username: updatedUser.username,
                email: updatedUser.email,
                is_active: updatedUser.is_active
            }
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thay đổi trạng thái người dùng',
            error: error.message
        });
    }
});

module.exports = router;