import { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bell, Database, Info, User, Save, RefreshCw, Download, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { useSetting, saveSetting } from '@/hooks/useDB'
import { db } from '@/db/database'

const APP_VERSION = '1.0.0'

// ─── Profile Tab ────────────────────────────────────────────────────────────
function ProfileTab() {
  const { toast } = useToast()
  const lawyerName = useSetting('lawyerName')
  const phone = useSetting('phone')
  const email = useSetting('email')
  const officeName = useSetting('officeName')
  const officeAddress = useSetting('officeAddress')
  const barCouncilNo = useSetting('barCouncilNo')

  const [form, setForm] = useState({ lawyerName: '', phone: '', email: '', officeName: '', officeAddress: '', barCouncilNo: '' })
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setForm({
      lawyerName: lawyerName ?? '',
      phone: phone ?? '',
      email: email ?? '',
      officeName: officeName ?? '',
      officeAddress: officeAddress ?? '',
      barCouncilNo: barCouncilNo ?? '',
    })
  }, [lawyerName, phone, email, officeName, officeAddress, barCouncilNo])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await Promise.all([
        saveSetting('lawyerName', form.lawyerName),
        saveSetting('phone', form.phone),
        saveSetting('email', form.email),
        saveSetting('officeName', form.officeName),
        saveSetting('officeAddress', form.officeAddress),
        saveSetting('barCouncilNo', form.barCouncilNo),
      ])
      toast({ title: 'Profile saved', description: 'Your profile has been updated.' })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch { toast({ title: 'Error', description: 'Failed to save profile.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Personal Information</h3>
        <p className="text-sm text-gray-500">This information will appear in generated documents and reports.</p>
      </div>
      <Separator />
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2 md:col-span-1">
          <Label>Lawyer / Advocate Name</Label>
          <Input className="mt-1.5" placeholder="Adv. Rajesh Sharma" value={form.lawyerName} onChange={e => setForm(f => ({ ...f, lawyerName: e.target.value }))} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Label>Phone Number</Label>
          <Input className="mt-1.5" placeholder="+91 98765 43210" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Label>Email Address</Label>
          <Input className="mt-1.5" type="email" placeholder="advocate@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
        </div>
        <div className="col-span-2 md:col-span-1">
          <Label>Bar Council No.</Label>
          <Input className="mt-1.5" placeholder="MAH/1234/2010" value={form.barCouncilNo} onChange={e => setForm(f => ({ ...f, barCouncilNo: e.target.value }))} />
        </div>
      </div>
      <Separator />
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Office Information</h3>
        <p className="text-sm text-gray-500">Your law firm or office details.</p>
      </div>
      <div className="grid grid-cols-2 gap-5">
        <div className="col-span-2 md:col-span-1">
          <Label>Office / Firm Name</Label>
          <Input className="mt-1.5" placeholder="Sharma & Associates" value={form.officeName} onChange={e => setForm(f => ({ ...f, officeName: e.target.value }))} />
        </div>
        <div className="col-span-2">
          <Label>Office Address</Label>
          <Input className="mt-1.5" placeholder="123, Law Chambers, Court Road, Mumbai - 400001" value={form.officeAddress} onChange={e => setForm(f => ({ ...f, officeAddress: e.target.value }))} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <Save className="w-4 h-4 mr-1.5" />{loading ? 'Saving...' : 'Save Profile'}
        </Button>
        {saved && (
          <div className="flex items-center gap-1.5 text-sm text-green-600">
            <CheckCircle2 className="w-4 h-4" />Profile saved!
          </div>
        )}
      </div>
    </form>
  )
}

// ─── Notifications Tab ───────────────────────────────────────────────────────
function NotificationsTab() {
  const { toast } = useToast()
  const notifEnabled = useSetting('notifEnabled')
  const notif1Day = useSetting('notif1Day')
  const notifSameDay = useSetting('notifSameDay')
  const notif1Hour = useSetting('notif1Hour')

  const [settings, setSettings] = useState({
    enabled: true, oneDayBefore: true, sameDayMorning: true, oneHourBefore: true,
  })

  useEffect(() => {
    setSettings({
      enabled: notifEnabled !== 'false',
      oneDayBefore: notif1Day !== 'false',
      sameDayMorning: notifSameDay !== 'false',
      oneHourBefore: notif1Hour !== 'false',
    })
  }, [notifEnabled, notif1Day, notifSameDay, notif1Hour])

  async function toggle(key: keyof typeof settings) {
    const newVal = !settings[key]
    setSettings(s => ({ ...s, [key]: newVal }))
    const settingKey = key === 'enabled' ? 'notifEnabled' : key === 'oneDayBefore' ? 'notif1Day' : key === 'sameDayMorning' ? 'notifSameDay' : 'notif1Hour'
    await saveSetting(settingKey, String(newVal))
    toast({ title: `${key === 'enabled' ? 'Notifications' : 'Reminder'} ${newVal ? 'enabled' : 'disabled'}` })
  }

  async function testNotification() {
    if (!('Notification' in window)) { toast({ title: 'Browser does not support notifications', variant: 'destructive' }); return }
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') { toast({ title: 'Notification permission denied', description: 'Please allow notifications in your browser settings.', variant: 'destructive' }); return }
    new Notification('Test Notification - LCMS', { body: 'This is a test notification from your Legal Case Management System.', icon: '/favicon.svg' })
    toast({ title: 'Test notification sent!' })
  }

  const items = [
    { key: 'enabled' as const, label: 'Enable Notifications', description: 'Receive browser notifications for hearing reminders' },
    { key: 'oneDayBefore' as const, label: '1 Day Before Reminder', description: 'Get notified the day before a hearing (9:00 AM)', disabled: !settings.enabled },
    { key: 'sameDayMorning' as const, label: 'Same Day 8 AM Reminder', description: 'Get a morning reminder on the day of hearing', disabled: !settings.enabled },
    { key: 'oneHourBefore' as const, label: '1 Hour Before Reminder', description: 'Get notified 1 hour before the hearing time', disabled: !settings.enabled },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Hearing Reminders</h3>
        <p className="text-sm text-gray-500">Configure when you receive notifications for upcoming hearings.</p>
      </div>
      <Separator />
      <div className="space-y-4">
        {items.map(({ key, label, description, disabled }) => (
          <div key={key} className={`flex items-center justify-between py-3 ${disabled ? 'opacity-50' : ''}`}>
            <div>
              <p className="text-sm font-medium text-gray-900">{label}</p>
              <p className="text-xs text-gray-500 mt-0.5">{description}</p>
            </div>
            <Switch checked={settings[key]} onCheckedChange={() => !disabled && toggle(key)} disabled={disabled} />
          </div>
        ))}
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Test Notification</h3>
        <p className="text-xs text-gray-500 mb-3">Click the button below to verify browser notifications are working correctly.</p>
        <Button variant="outline" onClick={testNotification} className="text-sm">
          <Bell className="w-4 h-4 mr-1.5" />Send Test Notification
        </Button>
      </div>
    </div>
  )
}

// ─── Data Tab ────────────────────────────────────────────────────────────────
function DataTab() {
  const { toast } = useToast()
  const [showReset, setShowReset] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [exportLoading, setExportLoading] = useState(false)

  const stats = useLiveQuery(async () => {
    const [clients, cases, hearings, payments, tasks, documents, communications, notes, variableCharges] = await Promise.all([
      db.clients.count(), db.cases.count(), db.hearings.count(), db.payments.count(),
      db.tasks.count(), db.documents.count(), db.communications.count(), db.notes.count(),
      db.variableCharges.count(),
    ])
    return { clients, cases, hearings, payments, tasks, documents, communications, notes, variableCharges }
  }, [])

  const storageEstimate = useLiveQuery(async () => {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate()
      const used = estimate.usage ?? 0
      const quota = estimate.quota ?? 0
      return { used: (used / (1024 * 1024)).toFixed(1), quota: (quota / (1024 * 1024)).toFixed(0), percent: quota ? Math.round((used / quota) * 100) : 0 }
    }
    return null
  }, [])

  async function handleExport() {
    setExportLoading(true)
    try {
      const [clients, cases, hearings, payments, tasks, documents, communications, notes, variableCharges, settings] = await Promise.all([
        db.clients.toArray(), db.cases.toArray(), db.hearings.toArray(), db.payments.toArray(),
        db.tasks.toArray(), db.documents.toArray(), db.communications.toArray(), db.notes.toArray(),
        db.variableCharges.toArray(), db.settings.toArray(),
      ])
      const exportData = { version: APP_VERSION, exportedAt: new Date().toISOString(), clients, cases, hearings, payments, tasks, documents: documents.map(d => ({ ...d, fileData: undefined })), communications, notes, variableCharges, settings }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `lcms-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast({ title: 'Data exported', description: 'Your data has been exported as a JSON file.' })
    } catch { toast({ title: 'Error', description: 'Failed to export data.', variant: 'destructive' }) }
    finally { setExportLoading(false) }
  }

  async function handleReset() {
    setResetLoading(true)
    try {
      await Promise.all([
        db.clients.clear(), db.cases.clear(), db.hearings.clear(), db.payments.clear(),
        db.tasks.clear(), db.documents.clear(), db.communications.clear(), db.notes.clear(),
        db.variableCharges.clear(), db.timeline.clear(), db.reminders.clear(),
      ])
      const { seedDemoData } = await import('@/db/demoData')
      await seedDemoData()
      toast({ title: 'Database reset', description: 'Demo data has been re-seeded.' })
      setShowReset(false)
    } catch { toast({ title: 'Error', description: 'Failed to reset database.', variant: 'destructive' }) }
    finally { setResetLoading(false) }
  }

  const records = [
    { label: 'Clients', count: stats?.clients ?? 0, color: 'text-blue-600' },
    { label: 'Cases', count: stats?.cases ?? 0, color: 'text-purple-600' },
    { label: 'Hearings', count: stats?.hearings ?? 0, color: 'text-green-600' },
    { label: 'Payments', count: stats?.payments ?? 0, color: 'text-orange-600' },
    { label: 'Tasks', count: stats?.tasks ?? 0, color: 'text-yellow-600' },
    { label: 'Documents', count: stats?.documents ?? 0, color: 'text-teal-600' },
    { label: 'Communications', count: stats?.communications ?? 0, color: 'text-pink-600' },
    { label: 'Notes', count: stats?.notes ?? 0, color: 'text-indigo-600' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Storage & Records */}
      <div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">Database Overview</h3>
        <p className="text-sm text-gray-500">Current data stored in your local IndexedDB database.</p>
      </div>
      <Separator />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {records.map(({ label, count, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
            <p className={`text-2xl font-bold ${color}`}>{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Storage Usage */}
      {storageEstimate && (
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Storage Usage</span>
            <span className="text-sm text-gray-500">{storageEstimate.used} MB / {storageEstimate.quota} MB</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${Math.min(storageEstimate.percent, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{storageEstimate.percent}% of browser storage quota used</p>
        </div>
      )}

      <Separator />

      {/* Export */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Export Data</h3>
        <p className="text-xs text-gray-500 mb-3">Download all your data as a JSON file for backup or transfer.</p>
        <Button variant="outline" onClick={handleExport} disabled={exportLoading}>
          <Download className="w-4 h-4 mr-1.5" />{exportLoading ? 'Exporting...' : 'Export All Data'}
        </Button>
      </div>

      <Separator />

      {/* Reset */}
      <div className="rounded-xl border border-red-100 bg-red-50/50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-semibold text-red-700 mb-1">Reset Database</h3>
            <p className="text-xs text-red-600 mb-3">This will permanently delete ALL data and re-seed with demo data. This action cannot be undone.</p>
            <Button variant="destructive" size="sm" onClick={() => setShowReset(true)}>
              <RefreshCw className="w-4 h-4 mr-1.5" />Reset & Re-seed Demo Data
            </Button>
          </div>
        </div>
      </div>

      {/* Reset Confirm Dialog */}
      <Dialog open={showReset} onOpenChange={open => !open && setShowReset(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <Trash2 className="w-5 h-5" />Reset Database
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to reset the database? All your data including clients, cases, hearings, and payments will be permanently deleted and replaced with demo data. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReset(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetLoading}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${resetLoading ? 'animate-spin' : ''}`} />
              {resetLoading ? 'Resetting...' : 'Yes, Reset Database'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── About Tab ───────────────────────────────────────────────────────────────
function AboutTab() {
  const techStack = [
    { name: 'React 18', desc: 'UI Framework' },
    { name: 'TypeScript', desc: 'Type-safe JavaScript' },
    { name: 'TailwindCSS', desc: 'Utility-first CSS' },
    { name: 'Dexie.js', desc: 'IndexedDB ORM' },
    { name: 'FullCalendar', desc: 'Calendar component' },
    { name: '@dnd-kit', desc: 'Drag & Drop' },
    { name: 'date-fns', desc: 'Date utility library' },
    { name: 'Radix UI', desc: 'Accessible components' },
    { name: 'Vite', desc: 'Build tool' },
    { name: 'jsPDF', desc: 'PDF generation' },
  ]

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-2xl text-white font-bold">⚖</span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">Legal Case Management System</h2>
          <p className="text-gray-500 text-sm mt-0.5">Version {APP_VERSION} — Built for Indian Advocates</p>
        </div>
      </div>
      <Separator />
      <div>
        <p className="text-sm text-gray-600 leading-relaxed">
          LCMS is a fully offline-capable case management system for independent advocates and law firms. All data is stored locally in your browser using IndexedDB — no server, no cloud, complete privacy.
        </p>
      </div>
      <Separator />
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Tech Stack</h3>
        <div className="grid grid-cols-2 gap-2">
          {techStack.map(({ name, desc }) => (
            <div key={name} className="flex items-center gap-2.5 p-2 bg-gray-50 rounded-lg border border-gray-100">
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">{name}</p>
                <p className="text-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Separator />
      <div className="text-xs text-gray-400 space-y-1">
        <p>All data is stored locally in your browser's IndexedDB. No data is sent to any server.</p>
        <p>For best experience, use a modern Chromium-based browser (Chrome, Edge, Brave).</p>
        <p className="pt-2 font-medium text-gray-500">© 2025 LCMS — Built with React + TypeScript</p>
      </div>
    </div>
  )
}

// ─── Settings Page ───────────────────────────────────────────────────────────
export default function Settings() {
  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile, notifications, and application data</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="profile" className="rounded-lg">
            <User className="w-4 h-4 mr-1.5" />Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg">
            <Bell className="w-4 h-4 mr-1.5" />Notifications
          </TabsTrigger>
          <TabsTrigger value="data" className="rounded-lg">
            <Database className="w-4 h-4 mr-1.5" />Data
          </TabsTrigger>
          <TabsTrigger value="about" className="rounded-lg">
            <Info className="w-4 h-4 mr-1.5" />About
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <TabsContent value="profile"><ProfileTab /></TabsContent>
          <TabsContent value="notifications"><NotificationsTab /></TabsContent>
          <TabsContent value="data"><DataTab /></TabsContent>
          <TabsContent value="about"><AboutTab /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
