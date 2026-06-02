const express = require('express');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

// Get personalized recommendations based on user's listening history
router.get('/', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const limit = parseInt(req.query.limit) || 20;

        // Get user's listening history
        const { data: history, error: historyError } = await supabase
            .from('play_history')
            .select('song_id, songs:song_id(artist)')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(50);

        if (historyError) {
            throw historyError;
        }

        // Extract artists from history
        const listenedArtists = [...new Set(
            history
                .filter(h => h.songs && h.songs.artist)
                .map(h => h.songs.artist)
        )];

        // Extract song IDs already listened
        const listenedSongIds = history.map(h => h.song_id);

        // Get recommendations based on similar artists
        let recommendations = [];
        if (listenedArtists.length > 0) {
            const { data: artistSongs, error: artistError } = await supabase
                .from('songs')
                .select('*')
                .in('artist', listenedArtists)
                .not('song_id', 'in', `(${listenedSongIds.join(',')})`)
                .eq('is_public', true)
                .order('play_count', { ascending: false })
                .limit(limit);

            if (!artistError && artistSongs) {
                recommendations = artistSongs;
            }
        }

        // If not enough recommendations, add trending songs
        if (recommendations.length < limit) {
            const { data: trending, error: trendingError } = await supabase
                .from('songs')
                .select('*')
                .not('song_id', 'in', `(${[...listenedSongIds, ...recommendations.map(r => r.song_id)].join(',')})`)
                .eq('is_public', true)
                .order('play_count', { ascending: false })
                .limit(limit - recommendations.length);

            if (!trendingError && trending) {
                recommendations = [...recommendations, ...trending];
            }
        }

        res.json({
            success: true,
            recommendations: recommendations.slice(0, limit)
        });
    } catch (error) {
        console.error('Get recommendations error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy gợi ý bài hát',
            error: error.message
        });
    }
});

// Get similar songs based on a specific song
router.get('/similar/:song_id', authenticate, async (req, res) => {
    try {
        const { song_id } = req.params;
        const limit = parseInt(req.query.limit) || 10;

        // Get the reference song
        const { data: song, error: songError } = await supabase
            .from('songs')
            .select('*')
            .eq('song_id', song_id)
            .single();

        if (songError || !song) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy bài hát'
            });
        }

        // Find similar songs by same artist
        const { data: similarSongs, error: similarError } = await supabase
            .from('songs')
            .select('*')
            .eq('artist', song.artist)
            .neq('song_id', song_id)
            .eq('is_public', true)
            .order('play_count', { ascending: false })
            .limit(limit);

        if (similarError) {
            throw similarError;
        }

        res.json({
            success: true,
            similar_songs: similarSongs || []
        });
    } catch (error) {
        console.error('Get similar songs error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy bài hát tương tự',
            error: error.message
        });
    }
});

// Get recently played songs for user
router.get('/recently-played', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const limit = parseInt(req.query.limit) || 20;

        const { data: history, error: historyError } = await supabase
            .from('play_history')
            .select(`
                played_at,
                songs:song_id (
                    song_id,
                    title,
                    artist,
                    cover_url,
                    duration_ms,
                    audio_url,
                    uploaded_by_name,
                    play_count
                )
            `)
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(limit);

        if (historyError) {
            throw historyError;
        }

        // Remove duplicates, keep most recent
        const uniqueSongs = [];
        const seenSongIds = new Set();

        for (const item of history) {
            if (item.songs && !seenSongIds.has(item.songs.song_id)) {
                uniqueSongs.push({
                    ...item.songs,
                    last_played_at: item.played_at
                });
                seenSongIds.add(item.songs.song_id);
            }
        }

        res.json({
            success: true,
            recently_played: uniqueSongs
        });
    } catch (error) {
        console.error('Get recently played error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy bài hát nghe gần đây',
            error: error.message
        });
    }
});

// Get top artists for user based on listening history
router.get('/top-artists', authenticate, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const limit = parseInt(req.query.limit) || 10;

        const { data: history, error: historyError } = await supabase
            .from('play_history')
            .select('songs:song_id(artist)')
            .eq('user_id', userId)
            .order('played_at', { ascending: false })
            .limit(1000);

        if (historyError) {
            throw historyError;
        }

        // Count plays per artist
        const artistCounts = {};
        history.forEach(item => {
            if (item.songs && item.songs.artist) {
                const artist = item.songs.artist;
                artistCounts[artist] = (artistCounts[artist] || 0) + 1;
            }
        });

        // Sort by play count
        const topArtists = Object.entries(artistCounts)
            .map(([artist, play_count]) => ({ artist, play_count }))
            .sort((a, b) => b.play_count - a.play_count)
            .slice(0, limit);

        res.json({
            success: true,
            top_artists: topArtists
        });
    } catch (error) {
        console.error('Get top artists error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy nghệ sĩ yêu thích',
            error: error.message
        });
    }
});

module.exports = router;
