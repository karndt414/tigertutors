export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fileName, fileData, contentType } = req.body;

    try {
        if (!fileName || !fileData || !contentType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_BUCKET_NAME || !process.env.CLOUDFLARE_R2_TOKEN) {
            return res.status(500).json({ error: 'Missing Cloudflare environment variables' });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(fileData, 'base64');

        const url = `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.CLOUDFLARE_BUCKET_NAME}/${fileName}`;

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${process.env.CLOUDFLARE_R2_TOKEN}`,
                'Content-Type': contentType,
                'Content-Length': buffer.length
            },
            body: buffer
        });

        if (!response.ok) {
            const responseText = await response.text();
            console.error('Cloudflare error:', response.status, responseText);
            return res.status(500).json({ 
                error: `Cloudflare upload failed: ${response.status} ${response.statusText}`,
                details: responseText
            });
        }

        const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;

        console.log('File uploaded to Cloudflare:', publicUrl);
        res.status(200).json({ success: true, publicUrl });
    } catch (error) {
        console.error('Cloudflare upload error:', error);
        res.status(500).json({ error: error.message });
    }
}