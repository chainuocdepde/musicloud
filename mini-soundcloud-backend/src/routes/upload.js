const express = require('express');
const multer = require('multer');
const supabase = require('../config/supabase');
const authenticate = require('../middleware/authenticate');

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    const allowedAudioTypes = process.env.ALLOWED_AUDIO_TYPES.split(',');
    const allowedImageTypes = process.env.ALLOWED_IMAGE_TYPES.split(',');

    console.log(`[${new Date().toISOString()}] 📎 fileFilter: field=${file.fieldname}, mimetype=${file.mimetype}, originalname=${file.originalname}`);

    if (file.fieldname === 'audio_file') {
        const isAudio = allowedAudioTypes.includes(file.mimetype)
            || file.mimetype.startsWith('audio/')
            || file.originalname.match(/\.(mp3|wav|m4a|ogg|aac|flac)$/i);
        if (isAudio) {
            cb(null, true);
        } else {
            console.log(`[${new Date().toISOString()}] ❌ fileFilter REJECT audio: ${file.mimetype} - ${file.originalname}`);
            cb(new Error(`File audio không hợp lệ: ${file.mimetype} - chỉ chấp nhận mp3, wav, m4a, ogg`), false);
        }
    } else if (file.fieldname === 'cover_image') {
        const isImage = allowedImageTypes.includes(file.mimetype)
            || file.mimetype.startsWith('image/')
            || file.originalname.match(/\.(jpg|jpeg|png|webp|gif)$/i);
        if (isImage) {
            cb(null, true);
        } else {
            console.log(`[${new Date().toISOString()}] ❌ fileFilter REJECT image: ${file.mimetype} - ${file.originalname}`);
            cb(new Error(`File ảnh không hợp lệ: ${file.mimetype} - chỉ chấp nhận jpg, png, webp`), false);
        }
    } else {
        console.log(`[${new Date().toISOString()}] ❌ fileFilter REJECT unknown field: ${file.fieldname}`);
        cb(new Error('Field không hợp lệ'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE)
    }
});

router.post('/song', authenticate, upload.fields([
    { name: 'audio_file', maxCount: 1 },
    { name: 'cover_image', maxCount: 1 }
]), async (req, res) => {
    const timestamp = Date.now();
    console.log(`[${new Date(timestamp).toISOString()}] POST /api/upload/song - Bắt đầu upload`);

    try {
        const { title, artist, description } = req.body;
        const userId = req.user.user_id;
        const username = req.user.username;

        console.log(`[${new Date().toISOString()}] Nhận request từ user: ${username} (${userId})`);
        console.log(`[${new Date().toISOString()}] Title: ${title}, Artist: ${artist}`);

        if (!title || !title.trim()) {
            console.log(`[${new Date().toISOString()}] Lỗi: Thiếu title`);
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên bài hát'
            });
        }

        if (!artist || !artist.trim()) {
            console.log(`[${new Date().toISOString()}] Lỗi: Thiếu artist`);
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên nghệ sĩ'
            });
        }

        if (!req.files || !req.files.audio_file) {
            console.log(`[${new Date().toISOString()}] Lỗi: Thiếu file audio`);
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file nhạc'
            });
        }

        const audioFile = req.files.audio_file[0];
        const coverFile = req.files.cover_image ? req.files.cover_image[0] : null;

        console.log(`[${new Date().toISOString()}] File audio: ${audioFile.originalname} (${(audioFile.size / 1024 / 1024).toFixed(2)} MB)`);
        if (coverFile) {
            console.log(`[${new Date().toISOString()}] File cover: ${coverFile.originalname}`);
        }

        const sanitizedName = audioFile.originalname
          .replace(/[^a-zA-Z0-9._-]/g, '_')
          .replace(/_+/g, '_');
        const audioFileName = `${userId}/${timestamp}_${sanitizedName}`;
        console.log(`[${new Date().toISOString()}] Đang upload audio lên Supabase Storage...`);

        const { data: audioUpload, error: audioError } = await supabase.storage
            .from('songs')
            .upload(audioFileName, audioFile.buffer, {
                contentType: audioFile.mimetype,
                upsert: false
            });

        if (audioError) {
            console.error(`[${new Date().toISOString()}] Lỗi upload audio:`, audioError);
            throw new Error(`Lỗi upload file audio: ${audioError.message}`);
        }

        console.log(`[${new Date().toISOString()}] Upload audio thành công`);

        const { data: audioUrlData } = supabase.storage
            .from('songs')
            .getPublicUrl(audioFileName);

        const audioUrl = audioUrlData.publicUrl;
        console.log(`[${new Date().toISOString()}] Audio URL: ${audioUrl}`);

        let coverUrl = null;
        if (coverFile) {
            const sanitizedCoverName = coverFile.originalname
              .replace(/[^a-zA-Z0-9._-]/g, '_')
              .replace(/_+/g, '_');
            const coverFileName = `${userId}/${timestamp}_${sanitizedCoverName}`;
            console.log(`[${new Date().toISOString()}] Đang upload cover lên Supabase Storage...`);

            const { data: coverUpload, error: coverError } = await supabase.storage
                .from('covers')
                .upload(coverFileName, coverFile.buffer, {
                    contentType: coverFile.mimetype,
                    upsert: false
                });

            if (coverError) {
                console.error(`[${new Date().toISOString()}] Lỗi upload cover:`, coverError);
                await supabase.storage.from('songs').remove([audioFileName]);
                throw new Error(`Lỗi upload ảnh bìa: ${coverError.message}`);
            }

            const { data: coverUrlData } = supabase.storage
                .from('covers')
                .getPublicUrl(coverFileName);

            coverUrl = coverUrlData.publicUrl;
            console.log(`[${new Date().toISOString()}] Upload cover thành công`);
        }

        const fileSizeMB = (audioFile.size / (1024 * 1024)).toFixed(2);
        console.log(`[${new Date().toISOString()}] Đang insert vào database...`);

        const { data: newSong, error: insertError } = await supabase
            .from('songs')
            .insert([
                {
                    title: title.trim(),
                    artist: artist.trim(),
                    description: description ? description.trim() : null,
                    audio_url: audioUrl,
                    cover_url: coverUrl,
                    duration_ms: 0,
                    file_size_mb: parseFloat(fileSizeMB),
                    uploaded_by_id: userId,
                    uploaded_by_name: username,
                    is_public: true,
                    play_count: 0
                }
            ])
            .select()
            .single();

        if (insertError) {
            console.error(`[${new Date().toISOString()}] Lỗi insert database:`, insertError);
            await supabase.storage.from('songs').remove([audioFileName]);
            if (coverUrl) {
                const coverFileName = `${userId}/${timestamp}_${coverFile.originalname}`;
                await supabase.storage.from('covers').remove([coverFileName]);
            }
            throw new Error(`Lỗi lưu vào database: ${insertError.message}`);
        }

        console.log(`[${new Date().toISOString()}] POST /api/upload/song - 201 Created - Thành công`);
        res.status(201).json({
            success: true,
            message: 'Đăng bài hát thành công',
            song: newSong
        });
    } catch (error) {
        console.error(`[${new Date().toISOString()}] POST /api/upload/song - 500 Error:`, error.message);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi upload bài hát'
        });
    }
});

router.use((error, req, res, next) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❗ Upload Error Handler:`);

    if (error instanceof multer.MulterError) {
        console.error(`[${timestamp}] 🔴 MulterError: code=${error.code}, field=${error.field}, message=${error.message}`);
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File quá lớn. Tối đa 50MB'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Lỗi upload: ${error.message}`
        });
    }

    if (error.message) {
        console.error(`[${timestamp}] 🔴 Custom Error: ${error.message}`);
        return res.status(400).json({
            success: false,
            message: error.message
        });
    }

    console.error(`[${timestamp}] 🔴 Unknown Error:`, error);
    next(error);
});

module.exports = router;