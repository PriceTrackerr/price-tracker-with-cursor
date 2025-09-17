import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // Use service role key for full access
const supabase = createClient(supabaseUrl, supabaseKey);

export interface User {
  id: string;
  email: string;
  password: string;
  username: string;
  created_at: string;
  last_login: string;
  role?: 'admin' | 'user' | 'banned';
  notification_settings?: any;
  privacy_settings?: any;
  preferences?: any;
  seen_price_drop_ids_subscription?: string[];
  affiliate?: any;
}

// Example for Product, Alert, Notification, etc. You can expand like your original interfaces
export interface Product {
  id: string;
  url: string;
  title: string;
  price: number;
  currency: string;
  platform: string;
  imageUrl: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

class SupabaseStorage {
  // ================= Users =================
  async addUser(userData: Omit<User, 'id' | 'created_at' | 'last_login'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const { error } = await supabase.from('users').insert([{
      id,
      email: userData.email,
      password: userData.password,
      username: userData.username,
      created_at: now,
      last_login: now,
      role: userData.role || 'user',
      notification_settings: userData.notification_settings || {},
      privacy_settings: userData.privacy_settings || {},
      preferences: userData.preferences || {},
      seen_price_drop_ids_subscription: userData.seen_price_drop_ids_subscription || [],
      affiliate: userData.affiliate || {}
    }]);
    if (error) throw error;
    return id;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('email', email).single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows found
    return data;
  }

  async getUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateUser(id: string, update: Partial<User>): Promise<boolean> {
    const { error } = await supabase.from('users').update(update).eq('id', id);
    if (error) throw error;
    return true;
  }

  async deleteUser(id: string): Promise<boolean> {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*');
    if (error) throw error;
    return data || [];
  }

  // ================= Products =================
  async addProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const { error } = await supabase.from('products').insert([{
      ...product,
      id,
      created_at: now,
      updated_at: now
    }]);
    if (error) throw error;
    return id;
  }

  async getProducts(userId?: string): Promise<Product[]> {
    let query = supabase.from('products').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async getProductById(id: string): Promise<Product | null> {
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  async updateProduct(id: string, update: Partial<Product>): Promise<boolean> {
    const { error } = await supabase.from('products').update(update).eq('id', id);
    if (error) throw error;
    return true;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // ================= Alerts =================
  async addAlert(alert: any): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const { error } = await supabase.from('alerts').insert([{ ...alert, id, created_at: now }]);
    if (error) throw error;
    return id;
  }

  async getAlerts(userId?: string): Promise<any[]> {
    let query = supabase.from('alerts').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateAlert(id: string, update: any): Promise<boolean> {
    const { error } = await supabase.from('alerts').update(update).eq('id', id);
    if (error) throw error;
    return true;
  }

  async deleteAlert(id: string): Promise<boolean> {
    const { error } = await supabase.from('alerts').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // ================= Notifications =================
  async addNotification(notification: any): Promise<string> {
    const id = uuidv4();
    const now = new Date().toISOString();
    const { error } = await supabase.from('notifications').insert([{ ...notification, id, timestamp: now }]);
    if (error) throw error;
    return id;
  }

  async getNotifications(userId?: string): Promise<any[]> {
    let query = supabase.from('notifications').select('*');
    if (userId) query = query.eq('user_id', userId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async updateNotification(id: string, update: any): Promise<boolean> {
    const { error } = await supabase.from('notifications').update(update).eq('id', id);
    if (error) throw error;
    return true;
  }

  async deleteNotification(id: string): Promise<boolean> {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw error;
    return true;
  }

  // You can replicate same pattern for priceHistory, payments, affiliate, etc.
}

export default new SupabaseStorage();
