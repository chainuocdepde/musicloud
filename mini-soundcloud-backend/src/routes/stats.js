const express = require('express');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Get user statistics
router.get('/user', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;

        // Get from user_stats view
        const { data: stats, error: statsError } = await supabase
            .from('user_stats')
            .select('*')
            .eq('user_id', userId)
            .single();

        if (statsError) {
            throw statsError;
        }

        // Get additional stats
        const { data: downloads, error: downloadsError } = await supabase
            .from('offline_downloads')
            .select('download_id')
            .eq('user_id', userId);

        const downloadsCount = downloads ? downloads.length : 0;

        res.json({
            success: true,
            stats: {
                ...stats,
                downloads_count: downloadsCount
            }
        });
    } catch (error) {
        console.error('Get user stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê người dùng',
            error: error.message
        });
    }
});

// Get listening stats for a time period
router.get('/listening', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const period = req.query.period || '7d'; // 7d, 30d, 1y, all

        let startDate;
        const now = new Date();

        switch (period) {
            case '7d':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '1y':
                startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(0); // All time
        }

        const { data: history, error: historyError } = await supabase
            .from('play_history')
            .select('*, songs:song_id(title, artist, duration_ms)')
            .eq('user_id', userId)
            .gte('played_at', startDate.toISOString());

        if (historyError) {
            throw historyError;
        }

        // Calculate stats
        const totalPlays = history.length;
        const totalMinutes = Math.floor(
            history.reduce((sum, h) => sum + (h.duration_listened_ms || 0), 0) / 60000
        );
        const uniqueSongs = new Set(history.map(h => h.song_id)).size;

        // Top songs
        const songCounts = {};
        history.forEach(h => {
            if (h.songs) {
                const key = h.song_id;
                if (!songCounts[key]) {
                    songCounts[key] = {
                        song_id: h.song_id,
                        title: h.songs.title,
                        artist: h.songs.artist,
                        play_count: 0
                    };
                }
                songCounts[key].play_count++;
            }
        });

        const topSongs = Object.values(songCounts)
            .sort((a, b) => b.play_count - a.play_count)
            .slice(0, 5);

        res.json({
            success: true,
            period,
            stats: {
                total_plays: totalPlays,
                total_minutes: totalMinutes,
                unique_songs: uniqueSongs,
                top_songs: topSongs
            }
        });
    } catch (error) {
        console.error('Get listening stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê nghe nhạc',
            error: error.message
        });
    }
});

// Get global platform stats (public)
router.get('/platform', async (req, res) => {
    try {
        // Total users
        const { count: usersCount, error: usersError } = await supabase
            .from('users')
            .select('user_id', { count: 'exact', head: true });

        // Total songs
        const { count: songsCount, error: songsError } = await supabase
            .from('songs')
            .select('song_id', { count: 'exact', head: true })
            .eq('is_public', true);

        // Total plays
        const { count: playsCount, error: playsError } = await supabase
            .from('play_history')
            .select('history_id', { count: 'exact', head: true });

        res.json({
            success: true,
            platform_stats: {
                total_users: usersCount || 0,
                total_songs: songsCount || 0,
                total_plays: playsCount || 0
            }
        });
    } catch (error) {
        console.error('Get platform stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy thống kê nền tảng',
            error: error.message
        });
    }
});

module.exports = router;
