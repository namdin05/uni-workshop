import { supabase, supabaseAdmin } from '../utils/supabase.js';

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
        const { data: existingUser, error: checkError } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('email', email)
            .single();
        
        if (checkError || !existingUser) {
            return res.status(403).json({ 
                message: 'Email của bạn không thuộc hệ thống nhà trường. Vui lòng liên hệ phòng Đào tạo!' 
            });
        }

        if (existingUser.auth_id) {
            return res.status(400).json({ 
                message: 'Tài khoản này đã được đăng ký. Vui lòng chuyển sang trang Đăng nhập!' 
            });
        }
        // 1. Tạo tài khoản trong Supabase Auth (Trả về UUID)
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
        });

        if (authError) throw authError;

        // 2. Lưu vào bảng users (id sẽ tự tăng, auth_id lưu UUID)
        const { error: dbError } = await supabaseAdmin
            .from('users')
            .update({
                auth_id: authData.user.id,
                full_name: fullName || existingUser.full_name,
            })
            .eq('id', existingUser.id);

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