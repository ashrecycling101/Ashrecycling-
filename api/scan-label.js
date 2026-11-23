export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { image } = req.body || {};
        if (!image) {
            return res.status(400).json({ error: 'No image provided' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'GEMINI_API_KEY is not set in Vercel environment variables' });
        }

        const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        const mimeType = match ? match[1] : 'image/jpeg';
        const base64Data = match ? match[2] : image.replace(/^data:image\/\w+;base64,/, '');

        const prompt = `You are an expert TV & electronics repair technician identifying TVs from back-panel stickers.
Analyze this sticker image carefully and extract:
1. "brand": The TV brand (e.g., Onn, Samsung, LG, Sony, TCL, Hisense, Vizio).
2. "model_number": The TV model number.
3. "serial_number": The serial number (often labeled S/N, Serial No., or under a barcode).
4. "screen_size": Screen size and/or main board/part code notes (e.g., "65 inch 4K LED TV (Board: M24054-MT)").

IMPORTANT IDENTIFICATION RULES FOR ONN TVs:
- Onn TVs frequently have serial numbers starting with "FD" (such as FD2403542G55000442) and main board / chassis numbers formatted like "M24054-MT", even when "Onn" or the 9-digit model number is not printed on that specific sticker.
- If you see an "FD..." serial number and/or an "M24...-MT" code, set "brand" to "Onn", deduce the model number ("100012587" for M24054-MT / 65" class), keep the exact "serial_number", and include the board code in "screen_size".

Return ONLY valid JSON:
{
  "brand": "string",
  "model_number": "string",
  "serial_number": "string",
  "screen_size": "string"
}`;

        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: mimeType,
                                        data: base64Data
                                    }
                                }
                            ]
                        }
                    ],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: 'application/json'
                    }
                })
            }
        );

        const data = await geminiResponse.json();
        if (!geminiResponse.ok) {
            return res.status(geminiResponse.status).json({
                error: data.error?.message || `Gemini API error (${geminiResponse.status})`
            });
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanedJson = rawText.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleanedJson);

        return res.status(200).json({
            brand: parsed.brand || '',
            model_number: parsed.model_number || '',
            serial_number: parsed.serial_number || '',
            screen_size: parsed.screen_size || ''
        });
    } catch (error) {
        console.error('Scan label error:', error);
        return res.status(500).json({ error: error.message || 'Failed to analyze sticker image' });
    }
}
