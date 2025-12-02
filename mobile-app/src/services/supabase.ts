import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import 'react-native-url-polyfill/auto';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or Anon Key is missing. Please check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Types
export interface User {
    id: string;
    email: string;
    created_at: string;
}

export interface Product {
    id: string;
    user_id: string;
    title: string;
    url: string;
    price: number;
    currency: string;
    platform: string;
    image_url?: string;
    created_at: string;
    updated_at: string;
}

export interface Alert {
    id: string;
    user_id: string;
    product_id: string;
    target_price: number;
    is_active: boolean;
    created_at: string;
}

// Auth functions
export const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    return { data, error };
};

export const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
    });
    return { data, error };
};

export const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
};

export const getCurrentUser = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
};

// Product functions
export const getProducts = async (userId: string) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { data, error };
};

export const getProduct = async (productId: string) => {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
    return { data, error };
};

// Alert functions
export const getAlerts = async (userId: string) => {
    const { data, error } = await supabase
        .from('price_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
    return { data, error };
};

export const createAlert = async (alert: Partial<Alert>) => {
    const { data, error } = await supabase
        .from('price_alerts')
        .insert([alert])
        .select()
        .single();
    return { data, error };
};

export const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
        .from('price_alerts')
        .delete()
        .eq('id', alertId);
    return { error };
};
