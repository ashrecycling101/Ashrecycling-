import mongoose from 'mongoose';

const VerificationSchema = new mongoose.Schema({
    brand: { type: String, required: true },
    model: { type: String, required: true },
    serial_number: { type: String, required: true, index: true },
    image_url: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    created_at: { type: Date, default: Date.now }
});

export default mongoose.models.Verification || mongoose.model('Verification', VerificationSchema);
