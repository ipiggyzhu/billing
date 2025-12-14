import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Session, User } from '@supabase/supabase-js'

interface AuthStore {
    session: Session | null
    user: User | null
    loading: boolean
    login: (email: string, password: string) => Promise<{ error: any }>
    register: (email: string, password: string, username: string) => Promise<{ error: any }>
    resetPassword: (email: string) => Promise<{ error: any }>
    logout: () => Promise<void>
    initialize: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
    session: null,
    user: null,
    loading: true,

    initialize: async () => {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        set({ session, user: session?.user ?? null, loading: false })

        // Listen for changes
        supabase.auth.onAuthStateChange((_event, session) => {
            set({ session, user: session?.user ?? null, loading: false })
        })
    },

    login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })
        return { error }
    },

    register: async (email, password, username) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username
                }
            }
        })
        return { error }
    },

    resetPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin, // Redirect back to app after clicking link
        })
        return { error }
    },

    logout: async () => {
        await supabase.auth.signOut()
        set({ session: null, user: null })
    }
}))
