import { supabase, supabaseAdmin } from '../utils/supabase.js';

const ROOM_IMAGE_BUCKET = 'room_images';

const sanitizeFileName = (fileName) => String(fileName || 'room-image')
    .split(/[\\/]/)
    .pop()
    .replace(/[^a-zA-Z0-9._-]/g, '_');

export const getRooms = async (req, res) => {
    try {
        const { data: rooms, error } = await supabase
            .from('rooms')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        res.status(200).json({ rooms });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách phòng:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách phòng' });
    }
};

export const getAdminRooms = async (req, res) => {
    try {
        const { data: rooms, error } = await supabaseAdmin
            .from('rooms')
            .select('*')
            .order('name', { ascending: true });

        if (error) throw error;

        res.status(200).json({ rooms });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách phòng admin:', error);
        res.status(500).json({ error: 'Lỗi server khi lấy danh sách phòng' });
    }
};

export const createRoom = async (req, res) => {
    try {
        const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
        const capacity = Number(req.body?.capacity);

        if (!name) {
            return res.status(400).json({ error: 'Tên phòng không được để trống' });
        }

        if (!Number.isFinite(capacity) || capacity <= 0) {
            return res.status(400).json({ error: 'Sức chứa phải là số lớn hơn 0' });
        }

        const payload = {
            name,
            capacity,
            layout_image_url: typeof req.body?.layout_image_url === 'string'
                ? (req.body.layout_image_url.trim() || null)
                : null,
        };

        const { data: room, error } = await supabaseAdmin
            .from('rooms')
            .insert([payload])
            .select('*')
            .single();

        if (error) throw error;

        return res.status(201).json({ room });
    } catch (error) {
        console.error('Lỗi khi tạo phòng:', error);
        return res.status(400).json({ error: error.message || 'Không thể tạo phòng' });
    }
};

export const updateRoom = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Phòng không hợp lệ' });
        }

        const payload = {};

        if (typeof req.body?.name === 'string' && req.body.name.trim()) {
            payload.name = req.body.name.trim();
        }

        if (req.body?.capacity !== undefined) {
            const capacity = Number(req.body.capacity);

            if (!Number.isFinite(capacity) || capacity <= 0) {
                return res.status(400).json({ error: 'Sức chứa phải là số lớn hơn 0' });
            }

            payload.capacity = capacity;
        }

        if (typeof req.body?.layout_image_url === 'string') {
            payload.layout_image_url = req.body.layout_image_url.trim() || null;
        }

        if (Object.keys(payload).length === 0) {
            return res.status(400).json({ error: 'Không có dữ liệu cập nhật' });
        }

        const { data: room, error } = await supabaseAdmin
            .from('rooms')
            .update(payload)
            .eq('id', id)
            .select('*')
            .single();

        if (error) throw error;

        return res.status(200).json({ room });
    } catch (error) {
        console.error('Lỗi khi cập nhật phòng:', error);
        return res.status(400).json({ error: error.message || 'Không thể cập nhật phòng' });
    }
};

export const uploadRoomLayoutImage = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isFinite(id)) {
            return res.status(400).json({ error: 'Phòng không hợp lệ' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Vui lòng chọn file ảnh' });
        }

        const safeFileName = sanitizeFileName(req.file.originalname);
        const storagePath = `rooms/${id}/${Date.now()}-${safeFileName}`;

        const { error: uploadError } = await supabaseAdmin.storage
            .from(ROOM_IMAGE_BUCKET)
            .upload(storagePath, req.file.buffer, {
                contentType: req.file.mimetype,
                upsert: false,
            });

        if (uploadError) {
            throw uploadError;
        }

        const { data: { publicUrl } } = supabaseAdmin.storage
            .from(ROOM_IMAGE_BUCKET)
            .getPublicUrl(storagePath);

        return res.status(201).json({
            message: 'Đã tải ảnh phòng lên Supabase Storage',
            layout_image_url: publicUrl,
            bucket: ROOM_IMAGE_BUCKET,
            path: storagePath,
        });
    } catch (error) {
        console.error('Lỗi khi upload ảnh phòng:', error);
        return res.status(500).json({ error: error.message || 'Không thể upload ảnh phòng' });
    }
};