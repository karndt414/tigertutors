export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fileName, fileData, contentType } = req.body;

    try {
        const response = await fetch(
            `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com/${process.env.CLOUDFLARE_BUCKET_NAME}/${fileName}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${process.env.CLOUDFLARE_R2_TOKEN}`,
                    'Content-Type': contentType
                },
                body: Buffer.from(fileData, 'base64')
            }
        );

        if (!response.ok) {
            throw new Error(`Cloudflare upload failed: ${response.statusText}`);
        }

        const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;

        console.log('File uploaded to Cloudflare:', publicUrl);
        res.status(200).json({ success: true, publicUrl });
    } catch (error) {
        console.error('Cloudflare upload error:', error);
        res.status(500).json({ error: error.message });
    }
}