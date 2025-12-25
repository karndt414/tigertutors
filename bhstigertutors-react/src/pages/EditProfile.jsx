import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import ImageUpload from '../ImageUpload';

function EditProfile({ session }) {
    const [profile, setProfile] = useState({ name: '', subjects: '', photo: '' });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getProfile();
    }, [session]);

    async function getProfile() {
        const { data } = await supabase
            .from('tutors')
            .select('*')
            .eq('user_id', session.user.id)
            .single();

        if (data) setProfile(data);
        setLoading(false);
    }

    async function handleSave(e) {
        e.preventDefault();
        const { error } = await supabase
            .from('tutors')
            .upsert({
                ...profile,
                user_id: session.user.id
            });

        if (error) alert(error.message);
        else alert("Profile updated!");
    }

    if (loading) return <p>Loading...</p>;

    return (
        <form onSubmit={handleSave}>
            <h2>Edit My Tutor Profile</h2>
            <input
                value={profile.name}
                onChange={e => setProfile({ ...profile, name: e.target.value })}
                placeholder="Full Name"
            />
            <input
                value={profile.subjects}
                onChange={e => setProfile({ ...profile, subjects: e.target.value })}
                placeholder="Subjects"
            />
            <ImageUpload onUpload={(url) => setProfile({ ...profile, photo: url })} />
            <button type="submit">Save Profile</button>
        </form>
    );
}