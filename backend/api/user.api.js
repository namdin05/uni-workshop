import { supabase } from '../utils/supabase.js'

export const getProfile = async (req, res) => {
    try {
        // Ưu tiên lấy từ Token, nếu không có thì lấy từ Query (chỉ dùng để test)
        const userId = req.user?.id || req.query.id; 

        if (!userId) {
            return res.status(400).json({ message: "Thiếu ID người dùng" });
        }

        const { data, error } = await supabase
            .from('users')
            .select('id, email, full_name, student_id, role')
            .eq('auth_id', userId)
            .single();
        
        if (error) throw error;
        return res.status(200).json({ profile: data });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }   
};

export const getMyRegistrations = async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Get user.id from auth.id
        const { data: userRecord, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('auth_id', userId)
            .single();

        if (userError) throw new Error('User not found');

        // Get registrations with workshop details and room info
        const { data, error } = await supabase
            .from('registrations')
            .select(`
                id,
                user_id,
                workshop_id,
                status,
                qr_code,
                checked_in_at,
                created_at,
                workshops!inner(
                    id,
                    title,
                    description,
                    start_time,
                    end_time,
                    speaker_name,
                    is_free,
                    price,
                    available_seats,
                    total_seats,
                    rooms(id, name, layout_image_url, capacity)
                )
            `)
            .eq('user_id', userRecord.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json({ registrations: data });
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
};