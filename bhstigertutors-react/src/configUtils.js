import { supabase } from './supabaseClient';

export const getTutoringLeadEmail = async () => {
    const { data } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'tutoring_lead_email')
        .single();
    
    return data?.value || 'wolfkame@bentonvillek12.org';
};