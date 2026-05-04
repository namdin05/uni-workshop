import { supabase } from "../utils/supabase.js";
import QRCode from 'qrcode';

// Helper: Generate QR code
const generateQRCode = async (registrationData) => {
    try {
        const qrString = JSON.stringify(registrationData);
        const qrDataUrl = await QRCode.toDataURL(qrString);
        return qrDataUrl;
    } catch (err) {
        throw new Error('Failed to generate QR code: ' + err.message);
    }
};

export const registerWorkshop = async (req, res) => {
    const { userId, workshopId } = req.body;

    try {
        // 1. Validate user and workshop exist
        const userRes = await supabase.from('users').select('id, full_name').eq('id', userId).single();
        if (userRes.error) throw new Error('User not found');

        const workshopRes = await supabase.from('workshops').select('id, title, start_time').eq('id', workshopId).single();
        if (workshopRes.error) throw new Error('Workshop not found');

        // 2. Generate QR code string (ticket identifier)
        const qrString = `TKT-${Date.now()}-${userId}-${workshopId}`;

        // 3. Generate QR code data URL
        const qrDataUrl = await generateQRCode({
            ticketId: qrString,
            userId: userId,
            workshopId: workshopId,
            userName: userRes.data.full_name,
            workshopTitle: workshopRes.data.title,
            timestamp: new Date().toISOString()
        });

        // 4. Call Stored Procedure để đảm bảo tính nguyên tử (Atomic)
        const { data, error } = await supabase.rpc('register_workshop', {
            p_user_id: userId,
            p_workshop_id: workshopId,
            p_qr_code: qrString
        });

        if (error) throw error;

        return res.status(200).json({
            success: true,
            registrationId: data.registration_id,
            qrCode: qrString,
            qrDataUrl: qrDataUrl,
            status: data.status
        });
    } catch (error) {
        // Xử lý lỗi: hết chỗ, đã đăng ký, v.v.
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const listWorkshops = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('workshops')
            .select(`
                *,
                rooms!inner(
                    id,
                    name,
                    layout_image_url,
                    capacity
                )
            `)
            .order('start_time', { ascending: true });

        if (error) throw error;
        return res.status(200).json({ workshops: data });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};

export const getWorkshopById = async (req, res) => {
    try {
        const id = req.params.id;
        const { data, error } = await supabase
            .from('workshops')
            .select(`
                *,
                rooms!inner(
                    id,
                    name,
                    layout_image_url,
                    capacity
                )
            `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return res.status(200).json({ workshop: data });
    } catch (err) {
        return res.status(404).json({ message: err.message });
    }
};

// Admin creation using service role (supabaseAdmin recommended from utils)
import { supabaseAdmin } from '../utils/supabase.js';

export const createWorkshop = async (req, res) => {
    try {
        const payload = req.body;
        const { data, error } = await supabaseAdmin
            .from('workshops')
            .insert([payload]);

        if (error) throw error;
        return res.status(201).json({ workshop: data[0] });
    } catch (err) {
        return res.status(400).json({ message: err.message });
    }
};

export const uploadCsv = async (req, res) => {
    try {
        // Expect CSV content in req.body.csv (text) for simplicity
        const csv = req.body.csv;
        if (!csv) return res.status(400).json({ message: 'Missing csv content' });

        // For demo: do not parse fully; respond accepted
        return res.status(202).json({ message: 'CSV received, processing queued' });
    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};