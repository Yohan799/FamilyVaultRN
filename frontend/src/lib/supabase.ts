import 'react-native-url-polyfill/auto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { supabaseStorageAdapter } from './storage';
import type { Database } from './types';

// Supabase configuration
const SUPABASE_URL = 'https://caxhxynhrpjuchcksnws.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNheGh4eW5ocnBqdWNoY2tzbndzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3MTk3MTMsImV4cCI6MjA4NjI5NTcxM30.wpEavXANBnTH8GIl9tB3Qrr0GSENaYFHjueEzrTVmpE';

// Lazy singleton for Supabase client
let _supabase: SupabaseClient<Database> | null = null;
let _initializationAttempted = false;

/**
 * Initialize Supabase client lazily
 * This ensures the client is created only when first accessed,
 * giving the native storage module time to load
 */
const initializeSupabase = (): SupabaseClient<Database> => {
    if (_supabase) return _supabase;

    _initializationAttempted = true;

    try {
        _supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
            auth: {
                storage: supabaseStorageAdapter,
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: false, // Important for React Native
            },
        });
        console.log('[Supabase] Client initialized successfully');
        return _supabase;
    } catch (error) {
        console.error('[Supabase] Failed to initialize client:', error);
        // Re-throw to let the caller handle it
        throw error;
    }
};

/**
 * Get the Supabase client instance (lazy initialization)
 * This is the recommended way to access the Supabase client
 */
export const getSupabase = (): SupabaseClient<Database> => {
    return initializeSupabase();
};

/**
 * Check if Supabase client is ready
 */
export const isSupabaseReady = (): boolean => {
    return _supabase !== null;
};

/**
 * Legacy export for backward compatibility
 * Uses a getter to ensure lazy initialization
 */
export const supabase: SupabaseClient<Database> = new Proxy({} as SupabaseClient<Database>, {
    get(_target, prop) {
        const client = initializeSupabase();
        const value = (client as unknown as Record<string | symbol, unknown>)[prop];
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    },
});
