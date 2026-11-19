import { connectDB } from '../lib/mongodb.js';
import Verification from '../models/Verification.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await connectDB();
        const { id, status } = req.body;

        if (!id || !['approved', 'rejected', 'pending'].includes(status)) {
            return res.status(400).json({ error: 'Invalid ID or status value.' });
        }

        const updated = await Verification.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!updated) {
            return res.status(404).json({ error: 'Submission not found.' });
        }

        return res.status(200).json({ success: true, updated });
    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
