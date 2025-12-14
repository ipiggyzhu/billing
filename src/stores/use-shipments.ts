import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { ShipmentRecord } from '../types/record'

interface ShipmentStore {
    shipments: ShipmentRecord[];
    loading: boolean;
    error: string | null;

    fetchShipments: () => Promise<void>;
    addShipment: (shipment: Omit<ShipmentRecord, 'id' | 'createdAt'>) => Promise<void>;
    updateShipment: (id: string, shipment: Partial<ShipmentRecord>) => Promise<void>;
    deleteShipment: (id: string) => Promise<void>;
    deleteShipments: (ids: string[]) => Promise<void>;

    // Setup Realtime Subscription
    subscribeToChanges: () => void;
    unsubscribe: () => void;
}

export const useShipmentStore = create<ShipmentStore>((set, get) => ({
    shipments: [],
    loading: false,
    error: null,

    fetchShipments: async () => {
        set({ loading: true, error: null })
        const { data, error } = await supabase
            .from('shipments')
            .select('*')
            .order('createdAt', { ascending: false })

        if (error) {
            set({ error: error.message, loading: false })
            return
        }

        set({ shipments: data as ShipmentRecord[], loading: false })
    },

    addShipment: async (shipment) => {
        // Optimistic update
        const tempId = crypto.randomUUID()
        const newRecord = { ...shipment, id: tempId, createdAt: new Date().toISOString() } as unknown as ShipmentRecord

        set((state) => ({ shipments: [newRecord, ...state.shipments] }))

        const { error } = await supabase
            .from('shipments')
            .insert({
                ...shipment,
                user_id: (await supabase.auth.getUser()).data.user?.id
            })

        if (error) {
            // Revert on error
            set((state) => ({ shipments: state.shipments.filter(s => s.id !== tempId), error: error.message }))
        } else {
            // Refresh to get real ID and server data
            get().fetchShipments()
        }
    },

    updateShipment: async (id, updatedShipment) => {
        // Optimistic update
        const originalShipments = get().shipments
        set((state) => ({
            shipments: state.shipments.map((s) => s.id === id ? { ...s, ...updatedShipment } : s)
        }))

        const { error } = await supabase
            .from('shipments')
            .update(updatedShipment)
            .eq('id', id)

        if (error) {
            // Revert
            set({ shipments: originalShipments, error: error.message })
        }
    },

    deleteShipment: async (id) => {
        // Optimistic update
        const originalShipments = get().shipments
        set((state) => ({
            shipments: state.shipments.filter((s) => s.id !== id)
        }))

        const { error } = await supabase
            .from('shipments')
            .delete()
            .eq('id', id)

        if (error) {
            // Revert
            set({ shipments: originalShipments, error: error.message })
        }
    },

    deleteShipments: async (ids) => {
        // Optimistic update
        const originalShipments = get().shipments
        set((state) => ({
            shipments: state.shipments.filter((s) => !ids.includes(s.id))
        }))

        const { error } = await supabase
            .from('shipments')
            .delete()
            .in('id', ids)

        if (error) {
            // Revert
            set({ shipments: originalShipments, error: error.message })
        }
    },

    subscribeToChanges: () => {
        const channel = supabase
            .channel('shipments-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'shipments' },
                () => {
                    get().fetchShipments()
                }
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    },

    unsubscribe: () => {
        supabase.removeAllChannels()
    }
}))
