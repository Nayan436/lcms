import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientProfile from './pages/ClientProfile'
import CaseDetail from './pages/CaseDetail'
import CalendarPage from './pages/CalendarPage'
import Payments from './pages/Payments'
import Settings from './pages/Settings'
import { Toaster } from './components/ui/toaster'
import { useEffect } from 'react'
import { db } from './db/database'

function App() {
  // Browser notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }

    // Check reminders every minute
    const interval = setInterval(async () => {
      const now = new Date()
      const due = await db.reminders
        .where('status').equals('Upcoming')
        .filter(r => new Date(r.reminderTime) <= now && !r.notified)
        .toArray()

      for (const reminder of due) {
        if ('Notification' in window && Notification.permission === 'granted') {
          const casee = await db.cases.get(reminder.caseId)
          const client = await db.clients.get(reminder.clientId)
          new Notification(`⚖️ ${reminder.title}`, {
            body: `${client?.name} – ${casee?.title}`,
            icon: '/favicon.svg',
          })
        }
        await db.reminders.update(reminder.id!, { notified: true, status: 'Completed' })
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="clients" element={<Clients />} />
          <Route path="clients/:clientId" element={<ClientProfile />} />
          <Route path="clients/:clientId/cases/:caseId" element={<CaseDetail />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <Toaster />
    </BrowserRouter>
  )
}

export default App
