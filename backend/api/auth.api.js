import { supabase } from '../utils/supabase.js';

const loadUserProfile = async (authId) => {
    const { data, error } = await supabase
        .from('users')
        .select('id, email, full_name, student_id, role')
        .eq('auth_id', authId)
        .single();

    if (error) throw error;

    return data;
};

export const register = async (req, res) => {
    const { email, password, fullName, studentId } = req.body;

    try {
        // 1. Tạo tài khoản trong Supabase Auth (Trả về UUID)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        // 2. Lưu vào bảng users (id sẽ tự tăng, auth_id lưu UUID)
        const { error: dbError } = await supabase
            .from('users')
            .insert({
                auth_id: authData.user.id, // Mapping UUID vào đây
                email,
                full_name: fullName,
                student_id: studentId,
                role: 'student'
            });

        if (dbError) throw dbError;

        const profile = await loadUserProfile(authData.user.id);

        return res.status(201).json({
            message: 'Đăng ký thành công!',
            user: authData.user,
            profile,
            token: authData.session?.access_token ?? null,
        });
    } catch (error) {
        return res.status(400).json({ message: error.message });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        const profile = await loadUserProfile(data.user.id);

        return res.status(200).json({
            message: 'Đăng nhập thành công',
            token: data.session.access_token,
            user: data.user,
            profile,
        });
    } catch (error) {
        return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác' });
    }
};