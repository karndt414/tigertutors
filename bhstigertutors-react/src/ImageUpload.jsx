import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import './ImageUpload.css'; // We'll create this

function ImageUpload({ onUpload }) {
    const [uploading, setUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const handleUpload = async (event) => {
        try {
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
            const { error: uploadError } = await supabase.storage
                .from('tutor-photos')
                .upload(filePath, file);

            if (uploadError) {
                throw uploadError;
            }

            // Get the public URL
            const { data } = supabase.storage
                .from('tutor-photos')
                .getPublicUrl(filePath);

            if (!data.publicUrl) {
                throw new Error('Could not get public URL.');
            }

            // Pass the URL up to the parent component (AdminPanel)
            onUpload(data.publicUrl);

        } catch (error) {
            alert('Error uploading image: ' + error.message);
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