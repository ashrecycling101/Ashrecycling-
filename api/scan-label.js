export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY not configured in Vercel.' });
    }

    const { image } = req.body;
    if (!image) {
        return res.status(400).json({ error: 'No image provided.' });
    }

    const matches = image.match(/^data:(image\/[a-zA-Z+-]+);base64,(.+)$/);
    if (!matches) {
        return res.status(400).json({ error: 'Invalid image format.' });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    try {
        const prompt = `Examine this TV back-panel sticker photo carefully, even if it is dimly lit, angled, or slightly blurry.
Extract:
1. "brand": The TV manufacturer/brand (e.g., Sceptre, Samsung, LG, Sony, Vizio, TCL, Hisense).
2. "model": The exact Model Number (often labeled Model, Model No., M/N, or printed inside a white box like OATV58DB).
3. "serialNumber": The exact Serial Number (often labeled Serial No., S/N, or below a barcode).

If any single field is completely unreadable or missing from the sticker, return "" for that field, while still returning the fields you CAN read.
Return ONLY valid JSON with no markdown:
{"brand": "", "model": "", "serialNumber": ""}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: mimeType, data: base64Data } }
                        ]
                    }],
                    generationConfig: {
                        temperature: 0.1,
                        responseMimeType: 'application/json'
                    }
                })
            }
        );

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Gemini Vision API error' });
        }

        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
        const cleanedJson = rawText.replace(/```json|```/g, '').trim();
        const extracted = JSON.parse(cleanedJson);

        return res.status(200).json({ extracted });
    } catch (error) {
        console.error('OCR Processing Error:', error);
        return res.status(500).json({ error: 'Failed to process image with Vision AI.' });
    }
}
