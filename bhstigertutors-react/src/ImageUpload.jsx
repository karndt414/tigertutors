import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
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
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Show preview
            setImagePreview(URL.createObjectURL(file));

            // Upload file to Supabase
            const { error: uploadError, data } = await supabase.storage
                .from('tutor-photos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            console.log('File uploaded successfully:', data);

            // Get the public URL
            const { data: publicUrlData } = supabase.storage
                .from('tutor-photos')
                .getPublicUrl(filePath);

            if (!publicUrlData || !publicUrlData.publicUrl) {
                throw new Error('Could not get public URL.');
            }

            console.log('Public URL:', publicUrlData.publicUrl);

            // Pass the URL up to the parent component (AdminPanel)
            onUpload(publicUrlData.publicUrl);

        } catch (err) {
            console.error('Error in handleUpload:', err);
            setError('Error uploading image: ' + err.message);
            setImagePreview(null);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="image-upload-container">
            {imagePreview ? (
                <img src={imagePreview} alt="Tutor preview" className="image-preview" />
            ) : (
                <div className="image-placeholder">No Photo</div>
            )}

            {error && <div style={{ color: 'var(--accent-danger)', fontSize: '0.9em' }}>{error}</div>}

            <label htmlFor="file-upload" className="file-upload-button">
                {uploading ? 'Uploading...' : 'Upload Photo'}
            </label>
            <input
                id="file-upload"
                type="file"
                accept="image/png, image/jpeg"
                onChange={handleUpload}
                disabled={uploading}
            />
        </div>
    );
}

export default ImageUpload;