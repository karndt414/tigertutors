import React, { useState, useEffect } from 'react';
import './ImageUpload.css';

function ImageUpload({ onUpload }) {
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);
    const [error, setError] = useState(null);

    const handleUpload = async (event) => {
        try {
            setError(null);
            setUploading(true);

            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.');
            }

            const file = event.target.files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `tutor-${Date.now()}.${fileExt}`;

            // Show preview
            setImagePreview(URL.createObjectURL(file));

            // Convert file to base64
            const reader = new FileReader();
            reader.onload = async () => {
                const base64Data = reader.result.split(',')[1];

                try {
                    // Upload to Cloudflare via API
                    const uploadResponse = await fetch('/api/upload-to-cloudflare', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            fileName,
                            fileData: base64Data,
                            contentType: file.type
                        })
                    });

                    if (!uploadResponse.ok) {
                        throw new Error('Upload failed');
                    }

                    const uploadData = await uploadResponse.json();
                    console.log('Public URL:', uploadData.publicUrl);

                    // Pass the URL up to the parent component
                    onUpload(uploadData.publicUrl);

                } catch (err) {
                    console.error('Error uploading to Cloudflare:', err);
                    setError('Error uploading image: ' + err.message);
                    setImagePreview(null);
                } finally {
                    setUploading(false);
                }
            };

            reader.onerror = () => {
                setError('Error reading file');
                setUploading(false);
            };

            reader.readAsDataURL(file);

        } catch (err) {
            console.error('Error in handleUpload:', err);
            setError('Error uploading image: ' + err.message);
            setImagePreview(null);
            setUploading(false);
        }
    };

    return (
        <div className="image-upload-container">
            {imagePreview ? (
                <img src={imagePreview} alt="Tutor preview" className="image-preview" />
            ) : (
                <div className="image-upload-placeholder">
                    <p>No image selected</p>
                </div>
            )}

            <input
                type="file"
                accept="image/*"
                onChange={handleUpload}
                disabled={uploading}
                className="image-input"
            />

            {uploading && <p>Uploading...</p>}
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default ImageUpload;