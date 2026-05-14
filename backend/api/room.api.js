import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

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