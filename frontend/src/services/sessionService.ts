import { supabase } from '@/lib/supabase';

export interface Session {
    id: string;
    user_id: string;
    device_name: string;
    device_type: string;
    ip_address: string | null;
    is_current: boolean | null;
    last_active_at: string;
    created_at: string;
    location: string | null;
}

/**
 * Creates a new session for the user
 */
export const createSession = async (
    userId: string,
    deviceInfo: {
        deviceName: string;
        deviceType: string;
        ipAddress?: string;
        location?: string;
    }
): Promise<Session | null> => {
    try {
        const { data, error } = await supabase
            .from('user_sessions')
            .insert({
                user_id: userId,
                device_name: deviceInfo.deviceName,
                device_type: deviceInfo.deviceType,
                ip_address: deviceInfo.ipAddress || null,
                location: deviceInfo.location || null,
                is_current: true,
                last_active_at: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) throw error;
        return data as Session;
    } catch (error) {
        console.error('Error creating session:', error);
        return null;
    }
};

/**
 * Gets all active sessions for a user
 */
export const getActiveSessions = async (userId: string): Promise<Session[]> => {
    try {
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('last_active_at', { ascending: false });

        if (error) throw error;
        return (data as Session[]) || [];
    } catch (error) {
        console.error('Error getting sessions:', error);
        return [];
    }
};

/**
 * Updates the last active timestamp for a session
 */
export const updateSessionActivity = async (sessionId: string): Promise<void> => {
    try {
        await supabase
            .from('user_sessions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', sessionId);
    } catch (error) {
        console.error('Error updating session activity:', error);
    }
};

/**
 * Ends a specific session (marks as not current)
 */
export const endSession = async (sessionId: string): Promise<void> => {
    try {
        await supabase
            .from('user_sessions')
            .update({
                is_current: false
            })
            .eq('id', sessionId);
    } catch (error) {
        console.error('Error ending session:', error);
    }
};

/**
 * Ends all sessions except the current one
 */
export const endAllOtherSessions = async (
    userId: string,
    currentSessionId: string
): Promise<void> => {
    try {
        await supabase
            .from('user_sessions')
            .update({
                is_current: false
            })
            .eq('user_id', userId)
            .neq('id', currentSessionId);
    } catch (error) {
        console.error('Error ending other sessions:', error);
    }
};

/**
 * Gets the current device session
 */
export const getCurrentSession = async (userId: string): Promise<Session | null> => {
    try {
        const { data, error } = await supabase
            .from('user_sessions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_current', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (error) return null;
        return data as Session;
    } catch (error) {
        console.error('Error getting current session:', error);
        return null;
    }
};

/**
 * Deletes a session permanently
 */
export const deleteSession = async (sessionId: string): Promise<void> => {
    try {
        await supabase
            .from('user_sessions')
            .delete()
            .eq('id', sessionId);
    } catch (error) {
        console.error('Error deleting session:', error);
    }
};

// Aliases for compatibility with older components
export type UserSession = Session;
export const fetchSessions = getActiveSessions;
