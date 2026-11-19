import { connectDB } from '../lib/mongodb.js';
import Verification from '../models/Verification.js';

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        await connectDB();
        const submissions = await Verification.find({}).sort({ created_at: -1 });
        return res.status(200).json({ success: true, submissions });
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
