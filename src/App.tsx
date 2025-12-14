import { useState, useEffect } from 'react'
import { DashboardLayout } from './components/layout/DashboardLayout'
import { ShipmentForm } from './components/ShipmentForm'
import { ShipmentList } from './components/ShipmentList'
import { StatsView } from './components/StatsView'
import { LoginPage } from './components/LoginPage'
import { useAuthStore } from './stores/use-auth'
import { useShipmentStore } from './stores/use-shipments'
import type { ShipmentRecord } from './types/record'

function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'stats'>('list')
  const [editingShipment, setEditingShipment] = useState<ShipmentRecord | undefined>(undefined)

  const handleEdit = (record: ShipmentRecord) => {
    setEditingShipment(record)
    setActiveTab('create')
  }

  const handleCreateNew = () => {
    setEditingShipment(undefined)
    setActiveTab('create')
  }

  const { user, loading, initialize } = useAuthStore()
  const { fetchShipments, subscribeToChanges, unsubscribe } = useShipmentStore()

  // Check auth status on load
  useEffect(() => {
    initialize()
  }, [])

  // Load data when user is authenticated
  useEffect(() => {
    if (user) {
      fetchShipments()
      subscribeToChanges()
      return () => unsubscribe()
    }
  }, [user])

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return (
    <DashboardLayout activeTab={activeTab} onTabChange={(tab) => {
      if (tab === 'create') handleCreateNew()
      else setActiveTab(tab)
    }}>
      {activeTab === 'list' && (
        <ShipmentList onEdit={handleEdit} />
      )}
      {activeTab === 'create' && (
        <ShipmentForm
          initialData={editingShipment}
          onSuccess={() => setActiveTab('list')}
        />
      )}
      {activeTab === 'stats' && (
        <StatsView />
      )}
    </DashboardLayout>
  )
}

export default App
