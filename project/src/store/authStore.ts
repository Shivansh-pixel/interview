import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({
        isAuthenticated: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: profile?.role || 'user',
        },
      });
    }
  },
  register: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: data.user.email!,
        role: 'user',
      });

      set({
        isAuthenticated: true,
        user: {
          id: data.user.id,
          email: data.user.email!,
          role: 'user',
        },
      });
    }
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      throw error;
    }

    set({ isAuthenticated: false, user: null });
  },
}));