import { connectDB } from '../lib/mongodb.js';
import Verification from '../models/Verification.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await connectDB();
        const { brand, model, serial_number, image } = req.body;

        if (!serial_number || !image) {
            return res.status(400).json({ error: 'Missing serial number or image data.' });
        }

        const newVerification = await Verification.create({
            brand: brand || 'Unknown',
            model: model || 'Unknown',
            serial_number: serial_number,
            image_url: image,
            status: 'pending'
        });

        return res.status(200).json({ 
            success: true, 
            id: newVerification._id, 
            message: 'Verification saved successfully to MongoDB.' 
        });

    } catch (error) {
        console.error('MongoDB Save Error:', error);
        return res.status(500).json({ error: 'Server error while saving to database: ' + error.message });
    }
}
