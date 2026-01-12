import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY
    }
});

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { fileName, fileData, contentType } = req.body;

    try {
        if (!fileName || !fileData || !contentType) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_BUCKET_NAME || !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY) {
            return res.status(500).json({ error: 'Missing Cloudflare environment variables' });
        }

        // Convert base64 to buffer
        const buffer = Buffer.from(fileData, 'base64');

        const command = new PutObjectCommand({
            Bucket: process.env.CLOUDFLARE_BUCKET_NAME,
            Key: fileName,
            Body: buffer,
            ContentType: contentType
        });

        await s3Client.send(command);

        const publicUrl = `${process.env.CLOUDFLARE_PUBLIC_URL}/${fileName}`;

        console.log('File uploaded to Cloudflare:', publicUrl);
        res.status(200).json({ success: true, publicUrl });
    } catch (error) {
        console.error('Cloudflare upload error:', error);
        res.status(500).json({ error: error.message });
    }
}