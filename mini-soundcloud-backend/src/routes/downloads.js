const express = require('express');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Get user's offline downloads
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const { data: downloads, error } = await supabase
            .from('offline_downloads')
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
            .eq('user_id', userId)
            .order('downloaded_at', { ascending: false });

        if (error) {
            throw error;
        }

        res.json({
            success: true,
            downloads: downloads || []
        });
    } catch (error) {
        console.error('Get downloads error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy danh sách tải xuống',
            error: error.message
        });
    }
});

// Add song to offline downloads
router.post('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { song_id, local_path, file_size_mb } = req.body;

        if (!song_id || !local_path) {
            return res.status(400).json({
                success: false,
                message: 'Thiếu song_id hoặc local_path'
            });
        }

        // Check if song exists
        const { data: song, error: songError } = await supabase
            .from('songs')
            .select('song_id')
            .eq('song_id', song_id)
            .single();

        if (songError || !song) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài hát'
            });
        }

        // Check if already downloaded
        const { data: existing } = await supabase
            .from('offline_downloads')
            .select('download_id')
            .eq('user_id', userId)
            .eq('song_id', song_id)
            .single();

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Bài hát đã được tải xuống'
            });
        }

        // Add download
        const { data: download, error: insertError } = await supabase
            .from('offline_downloads')
            .insert([
                {
                    user_id: userId,
                    song_id: song_id,
                    local_path: local_path,
                    file_size_mb: file_size_mb || 0
                }
            ])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        res.json({
            success: true,
            message: 'Đã thêm vào tải xuống',
            download
        });
    } catch (error) {
        console.error('Add download error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi thêm tải xuống',
            error: error.message
        });
    }
});

// Delete offline download
router.delete('/:download_id', authenticate, async (req, res) => {
    try {
        const { download_id } = req.params;
        const userId = req.user.user_id;

        const { data: download, error: findError } = await supabase
            .from('offline_downloads')
            .select('*')
            .eq('download_id', download_id)
            .single();

        if (findError || !download) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bản tải xuống'
            });
        }

        if (download.user_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Bạn không có quyền xóa bản tải xuống này'
            });
        }

        const { error: deleteError } = await supabase
            .from('offline_downloads')
            .delete()
            .eq('download_id', download_id);

        if (deleteError) {
            throw deleteError;
        }

        res.json({
            success: true,
            message: 'Đã xóa bản tải xuống'
        });
    } catch (error) {
        console.error('Delete download error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi xóa bản tải xuống',
            error: error.message
        });
    }
});

module.exports = router;
