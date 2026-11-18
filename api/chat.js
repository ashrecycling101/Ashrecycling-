export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const apiKey = process.env.OLLAMA_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'OLLAMA_API_KEY is not configured on the server.' });
    }

    const { contents } = req.body;
    if (!contents || !Array.isArray(contents)) {
        return res.status(400).json({ error: 'Invalid chat history payload.' });
    }

    const SYSTEM_PROMPT = `
You are the helpful, friendly customer support assistant for Ash Recycling (www.ash-recycling.com), specializing in TV parts recycling and e-waste management.
Keep answers concise, clear, and helpful (2-4 sentences max unless listing membership tiers).

Key Business Facts:
- Service Area: Standard free recycling pickups are strictly for Ventura, CA (ZIP code 93004). Outside 93004, service/pickup fees apply.
- TV Size Policy: TVs 65 inches and below are FREE to recycle for members. TVs larger than 65 inches incur a fee.
- Membership Tiers (All free to join, valid for 6 months to 1 year):
  1. Silver: Free membership, free recycling for TVs 65" and below, member discount, basic recycling services.
  2. Gold: All Silver benefits + bigger discount, discount on TV repair services, TV pickup available (pickup fee applies).
  3. Platinum: Exclusive for TekShawn customers outside the 93004 service area. All Gold benefits + extra service discounts.
  4. Diamond: Premium package, free membership included, TV services starting at $100, includes Repair Services & Move-in Special (TV consultation & relocation).
- TV Repairs: Recycling does NOT include free repair. For expert TV repair, diagnostics, or mounting, refer customers to TekShawn (www.tekshawn.com).
- Replacement Parts: Tested TV parts are sold globally on eBay at https://www.ebay.com/usr/ash-recycling.
- Contact Info: Email ashrecycling101@gmail.com | Phone/WhatsApp: +1 (805) 396-2780.
- Encourage customers to use the "Book a Pickup" form on the page or click "Apply Now" on a membership card.
`;

    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...contents.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : 'user',
            content: msg.parts?.[0]?.text || ''
        }))
    ];

    try {
        const response = await fetch('https://ollama.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-v4.1-flash',
                messages: messages,
                temperature: 0.4,
                max_tokens: 300
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json({ error: data.error?.message || 'Ollama Cloud API Error' });
        }

        const reply = data.choices?.[0]?.message?.content || '';
        return res.status(200).json({ reply });

    } catch (error) {
        console.error('Ollama Serverless Chat Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}
