import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Briefcase, Calendar, IndianRupee, TrendingUp, Clock,
  CheckCircle2, Circle, AlertCircle, ChevronRight, Plus,
  UserPlus, FolderPlus, CalendarPlus, FileText, CreditCard,
  AlertTriangle, ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import {
  useStats, usePendingCollections, useClients, useCases,
  addClient, addCase, addHearing, addNote, addPayment, updateTask,
} from '@/hooks/useDB'
import { db } from '@/db/database'
import {
  formatCurrency, formatDate, formatTime, timeAgo, getHearingStatusColor,
  getTaskPriorityColor, getInitials, getTimelineIcon, CASE_TYPES,
  HEARING_STATUSES, PAYMENT_MODES,
} from '@/lib/utils'
import { isToday, format, differenceInMinutes } from 'date-fns'

type ModalType = 'client' | 'case' | 'hearing' | 'note' | 'payment' | null

function AddClientModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', mobile: '', email: '', address: '' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim()) return
    setLoading(true)
    try {
      await addClient({ name: form.name.trim(), mobile: form.mobile.trim(), email: form.email.trim() || undefined, address: form.address.trim() || undefined })
      toast({ title: 'Client added', description: `${form.name} has been added.` })
      onClose()
    } catch { toast({ title: 'Error', description: 'Failed to add client.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Full Name *</Label><Input className="mt-1" placeholder="Ramesh Kumar" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
        <div><Label>Mobile *</Label><Input className="mt-1" placeholder="9876543210" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} required /></div>
        <div><Label>Email</Label><Input className="mt-1" type="email" placeholder="email@example.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
        <div className="col-span-2"><Label>Address</Label><Input className="mt-1" placeholder="Street, City" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Client'}</Button>
      </DialogFooter>
    </form>
  )
}

function AddCaseModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const [form, setForm] = useState({ clientId: '', title: '', caseNumber: '', caseType: '', courtName: '', status: 'Filed', fixedFee: '' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId || !form.title.trim() || !form.caseType || !form.courtName.trim()) return
    setLoading(true)
    try {
      await addCase({ clientId: Number(form.clientId), title: form.title.trim(), caseNumber: form.caseNumber.trim() || undefined, caseType: form.caseType, courtName: form.courtName.trim(), status: form.status, fixedFee: Number(form.fixedFee) || 0 })
      toast({ title: 'Case added' })
      onClose()
    } catch { toast({ title: 'Error', description: 'Failed to add case.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Client *</Label><Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="col-span-2"><Label>Case Title *</Label><Input className="mt-1" placeholder="e.g. Sharma vs State" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
        <div><Label>Case Number</Label><Input className="mt-1" placeholder="CNR/CC No." value={form.caseNumber} onChange={e => setForm(f => ({ ...f, caseNumber: e.target.value }))} /></div>
        <div><Label>Case Type *</Label><Select value={form.caseType} onValueChange={v => setForm(f => ({ ...f, caseType: v }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select type" /></SelectTrigger><SelectContent>{CASE_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Court Name *</Label><Input className="mt-1" placeholder="District Court" value={form.courtName} onChange={e => setForm(f => ({ ...f, courtName: e.target.value }))} required /></div>
        <div><Label>Fixed Fee (₹)</Label><Input className="mt-1" type="number" min="0" placeholder="0" value={form.fixedFee} onChange={e => setForm(f => ({ ...f, fixedFee: e.target.value }))} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.clientId || !form.caseType}>{loading ? 'Adding...' : 'Add Case'}</Button>
      </DialogFooter>
    </form>
  )
}

function AddHearingModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const [form, setForm] = useState({ clientId: '', caseId: '', date: '', time: '10:00', courtNumber: '', judgeName: '', remarks: '', status: 'Scheduled' as const })
  const [loading, setLoading] = useState(false)
  const clientCases = cases.filter(c => String(c.clientId) === form.clientId)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caseId || !form.date) return
    const sc = cases.find(c => String(c.id) === form.caseId)
    if (!sc) return
    setLoading(true)
    try {
      await addHearing({ caseId: Number(form.caseId), clientId: sc.clientId, date: new Date(form.date), time: form.time, courtNumber: form.courtNumber.trim() || undefined, judgeName: form.judgeName.trim() || undefined, remarks: form.remarks.trim() || undefined, status: form.status })
      toast({ title: 'Hearing scheduled' })
      onClose()
    } catch { toast({ title: 'Error', description: 'Failed to add hearing.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Client *</Label><Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v, caseId: '' }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Case *</Label><Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))} disabled={!form.clientId}><SelectTrigger className="mt-1"><SelectValue placeholder="Select case" /></SelectTrigger><SelectContent>{clientCases.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Date *</Label><Input className="mt-1" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
        <div><Label>Time *</Label><Input className="mt-1" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required /></div>
        <div><Label>Court Number</Label><Input className="mt-1" placeholder="Court No. 5" value={form.courtNumber} onChange={e => setForm(f => ({ ...f, courtNumber: e.target.value }))} /></div>
        <div><Label>Judge Name</Label><Input className="mt-1" placeholder="Hon. Justice..." value={form.judgeName} onChange={e => setForm(f => ({ ...f, judgeName: e.target.value }))} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.caseId || !form.date}>{loading ? 'Adding...' : 'Schedule Hearing'}</Button>
      </DialogFooter>
    </form>
  )
}

function AddNoteModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const [form, setForm] = useState({ clientId: '', caseId: '', content: '' })
  const [loading, setLoading] = useState(false)
  const clientCases = cases.filter(c => String(c.clientId) === form.clientId)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caseId || !form.content.trim()) return
    const sc = cases.find(c => String(c.id) === form.caseId)
    if (!sc) return
    setLoading(true)
    try {
      await addNote({ caseId: Number(form.caseId), clientId: sc.clientId, content: form.content.trim(), date: new Date() })
      toast({ title: 'Note added' })
      onClose()
    } catch { toast({ title: 'Error', description: 'Failed to add note.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Client *</Label><Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v, caseId: '' }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Case *</Label><Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))} disabled={!form.clientId}><SelectTrigger className="mt-1"><SelectValue placeholder="Select case" /></SelectTrigger><SelectContent>{clientCases.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}</SelectContent></Select></div>
        <div className="col-span-2"><Label>Note *</Label><Textarea className="mt-1 min-h-[100px]" placeholder="Write your note..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.caseId || !form.content.trim()}>{loading ? 'Adding...' : 'Add Note'}</Button>
      </DialogFooter>
    </form>
  )
}

function AddPaymentModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const [form, setForm] = useState({ clientId: '', caseId: '', amount: '', date: new Date().toISOString().split('T')[0], paymentMode: 'Cash' as const, remarks: '' })
  const [loading, setLoading] = useState(false)
  const clientCases = cases.filter(c => String(c.clientId) === form.clientId)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caseId || !form.amount) return
    const sc = cases.find(c => String(c.id) === form.caseId)
    if (!sc) return
    setLoading(true)
    try {
      await addPayment({ caseId: Number(form.caseId), clientId: sc.clientId, amount: Number(form.amount), date: new Date(form.date), paymentMode: form.paymentMode, remarks: form.remarks.trim() || undefined })
      toast({ title: 'Payment recorded' })
      onClose()
    } catch { toast({ title: 'Error', description: 'Failed to record payment.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }
  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Client *</Label><Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v, caseId: '' }))}><SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger><SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Case *</Label><Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))} disabled={!form.clientId}><SelectTrigger className="mt-1"><SelectValue placeholder="Select case" /></SelectTrigger><SelectContent>{clientCases.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Amount (₹) *</Label><Input className="mt-1" type="number" min="1" placeholder="5000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required /></div>
        <div><Label>Date *</Label><Input className="mt-1" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
        <div><Label>Payment Mode</Label><Select value={form.paymentMode} onValueChange={(v: any) => setForm(f => ({ ...f, paymentMode: v }))}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
        <div className="col-span-2"><Label>Remarks</Label><Input className="mt-1" placeholder="Optional remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.caseId || !form.amount}>{loading ? 'Recording...' : 'Record Payment'}</Button>
      </DialogFooter>
    </form>
  )
}

function getHearingBorderColor(status: string, isCurrent: boolean) {
  if (isCurrent) return 'border-l-orange-500 bg-orange-50/60'
  if (status === 'Completed') return 'border-l-green-500 bg-green-50/40'
  if (status === 'Scheduled') return 'border-l-blue-500 bg-blue-50/40'
  if (status === 'Adjourned') return 'border-l-yellow-500 bg-yellow-50/40'
  return 'border-l-gray-400 bg-gray-50'
}

function StatCard({ icon: Icon, label, value, color, iconBg }: { icon: React.ElementType; label: string; value: string | number; color: string; iconBg: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 leading-tight truncate">{value}</p>
      </div>
    </div>
  )
}

const modalMeta: Record<NonNullable<ModalType>, { title: string; description: string }> = {
  client: { title: 'Add New Client', description: 'Create a new client profile.' },
  case: { title: 'Add New Case', description: 'Create a new case for an existing client.' },
  hearing: { title: 'Schedule Hearing', description: 'Add a new court hearing.' },
  note: { title: 'Add Note', description: 'Attach a note to a case.' },
  payment: { title: 'Record Payment', description: 'Record a fee payment from a client.' },
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [openModal, setOpenModal] = useState<ModalType>(null)

  const stats = useStats()
  const pendingCollections = usePendingCollections() ?? []

  // All enriched queries read directly from DB — no live-array deps to avoid infinite loops
  const enrichedTimeline = useLiveQuery(async () => {
    const entries = await db.timeline.orderBy('createdAt').reverse().limit(8).toArray()
    return Promise.all(entries.map(async (entry) => {
      const [caseData, clientData] = await Promise.all([db.cases.get(entry.caseId), db.clients.get(entry.clientId)])
      return { ...entry, caseName: caseData?.title ?? 'Unknown', clientName: clientData?.name ?? 'Unknown' }
    }))
  }, [])

  const enrichedTodayHearings = useLiveQuery(async () => {
    const today = new Date()
    const start = new Date(today); start.setHours(0, 0, 0, 0)
    const end = new Date(today); end.setHours(23, 59, 59, 999)
    const hearings = await db.hearings.where('date').between(start, end, true, true).toArray()
    const sorted = hearings.sort((a, b) => a.time.localeCompare(b.time))
    return Promise.all(sorted.map(async (h) => {
      const [caseData, clientData] = await Promise.all([db.cases.get(h.caseId), db.clients.get(h.clientId)])
      return { ...h, caseName: caseData?.title ?? 'Unknown', clientName: clientData?.name ?? 'Unknown', courtName: caseData?.courtName ?? '' }
    }))
  }, [])

  const nextHearing = useLiveQuery(async () => {
    const now = new Date()
    const future = new Date(now.getTime() + 30 * 86400000)
    const hearings = await db.hearings.where('date').between(now, future, true, true).toArray()
    const upcoming = hearings
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time))
      .filter(h => {
        const [hh, mm] = h.time.split(':').map(Number)
        const dt = new Date(h.date); dt.setHours(hh, mm, 0, 0)
        return dt > now
      })
    if (!upcoming.length) return null
    const h = upcoming[0]
    const [caseData, clientData] = await Promise.all([db.cases.get(h.caseId), db.clients.get(h.clientId)])
    const [hh, mm] = h.time.split(':').map(Number)
    const dt = new Date(h.date); dt.setHours(hh, mm, 0, 0)
    return { ...h, caseName: caseData?.title ?? 'Unknown', clientName: clientData?.name ?? 'Unknown', minsUntil: differenceInMinutes(dt, now) }
  }, [])

  const enrichedTasks = useLiveQuery(async () => {
    const allTasks = await db.tasks.where('status').notEqual('Completed').toArray()
    const urgent = allTasks
      .filter(t => t.priority === 'Urgent' || t.priority === 'High')
      .sort((a, b) => (a.dueDate ? new Date(a.dueDate).getTime() : Infinity) - (b.dueDate ? new Date(b.dueDate).getTime() : Infinity))
      .slice(0, 5)
    return Promise.all(urgent.map(async (t) => {
      const caseData = t.caseId ? await db.cases.get(t.caseId) : null
      return { ...t, caseName: caseData?.title }
    }))
  }, [])

  const now = new Date()
  function isCurrentHearing(h: { date: Date | string; time: string }) {
    if (!isToday(new Date(h.date))) return false
    const [hh, mm] = h.time.split(':').map(Number)
    const dt = new Date(h.date); dt.setHours(hh, mm, 0, 0)
    const diff = differenceInMinutes(dt, now)
    return diff >= -30 && diff <= 30
  }

  const quickActions = [
    { label: 'New Client', icon: UserPlus, modal: 'client' as ModalType, cls: 'text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { label: 'New Case', icon: FolderPlus, modal: 'case' as ModalType, cls: 'text-violet-600 bg-violet-50 hover:bg-violet-100 border-violet-200' },
    { label: 'Add Hearing', icon: CalendarPlus, modal: 'hearing' as ModalType, cls: 'text-green-600 bg-green-50 hover:bg-green-100 border-green-200' },
    { label: 'Add Note', icon: FileText, modal: 'note' as ModalType, cls: 'text-orange-600 bg-orange-50 hover:bg-orange-100 border-orange-200' },
    { label: 'Add Payment', icon: CreditCard, modal: 'payment' as ModalType, cls: 'text-rose-600 bg-rose-50 hover:bg-rose-100 border-rose-200' },
  ]

  return (
    <div className="space-y-6 pb-8">
      {/* Header + Quick Actions */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(now, 'EEEE, dd MMMM yyyy')}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {quickActions.map(({ label, icon: Icon, modal, cls }) => (
            <button key={label} onClick={() => setOpenModal(modal)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${cls}`}>
              <Icon className="w-4 h-4" />
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase} label="Active Cases" value={stats?.activeCases ?? 0} color="text-blue-600" iconBg="bg-blue-100" />
        <StatCard icon={Calendar} label="Today's Hearings" value={stats?.todayHearings ?? 0} color="text-green-600" iconBg="bg-green-100" />
        <StatCard icon={IndianRupee} label="Pending Fees" value={stats ? formatCurrency(stats.pendingFees) : '...'} color="text-red-600" iconBg="bg-red-100" />
        <StatCard icon={TrendingUp} label="New This Month" value={stats?.newCasesThisMonth ?? 0} color="text-purple-600" iconBg="bg-purple-100" />
      </div>

      {/* Main 3-col grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule - takes 2 cols */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-semibold text-gray-900">Today's Schedule</h2>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{enrichedTodayHearings?.length ?? 0} hearing{(enrichedTodayHearings?.length ?? 0) !== 1 ? 's' : ''}</Badge>
              <button onClick={() => setOpenModal('hearing')} className="p-1 rounded-lg hover:bg-gray-100 transition-colors"><Plus className="w-4 h-4 text-gray-500" /></button>
            </div>
          </div>
          {(!enrichedTodayHearings || enrichedTodayHearings.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Calendar className="w-8 h-8 text-gray-400" /></div>
              <p className="text-gray-600 font-semibold text-lg">No hearings today</p>
              <p className="text-gray-400 text-sm mt-1 mb-4">Your schedule is clear for today.</p>
              <Button variant="outline" size="sm" onClick={() => setOpenModal('hearing')}><Plus className="w-4 h-4 mr-1.5" />Schedule a Hearing</Button>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {enrichedTodayHearings.map((h) => {
                const isCurrent = isCurrentHearing(h)
                return (
                  <div key={h.id} onClick={() => h.caseId && h.clientId && navigate(`/clients/${h.clientId}/cases/${h.caseId}`)}
                    className={`flex items-center gap-4 px-5 py-4 border-l-[3px] cursor-pointer hover:brightness-95 transition-all ${getHearingBorderColor(h.status, isCurrent)}`}>
                    <div className="text-center w-16 flex-shrink-0">
                      <p className="text-base font-bold text-gray-900 leading-none">{formatTime(h.time)}</p>
                      {isCurrent && <span className="text-xs font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-full mt-1 inline-block">LIVE</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{h.clientName}</p>
                      <p className="text-sm text-gray-500 truncate">{h.caseName}</p>
                      {h.courtName && <p className="text-xs text-gray-400 mt-0.5 truncate">{h.courtName}</p>}
                    </div>
                    <Badge className={`text-xs flex-shrink-0 border ${getHearingStatusColor(h.status)}`}>{h.status}</Badge>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Next Hearing + Collections */}
        <div className="space-y-4">
          {/* Next Hearing Card */}
          {nextHearing ? (
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl p-5 text-white shadow-md">
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-2">Next Hearing</p>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-xl font-bold truncate">{nextHearing.clientName}</p>
                  <p className="text-blue-100 text-sm truncate mt-0.5">{nextHearing.caseName}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold">{formatTime(nextHearing.time)}</p>
                  <p className="text-blue-200 text-xs">{isToday(new Date(nextHearing.date)) ? 'Today' : formatDate(nextHearing.date)}</p>
                </div>
              </div>
              <div className="mt-4 pt-3 border-t border-white/20 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-200 flex-shrink-0" />
                <span className="text-blue-100 text-sm">
                  {nextHearing.minsUntil < 60 ? `Starts in ${nextHearing.minsUntil} min` : `Starts in ${Math.round(nextHearing.minsUntil / 60)} hr`}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl p-5 text-center">
              <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 font-medium text-sm">No upcoming hearings</p>
            </div>
          )}

          {/* Pending Collections */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2"><IndianRupee className="w-4 h-4 text-red-500" /><h3 className="text-sm font-semibold text-gray-900">Pending Collections</h3></div>
              <button onClick={() => navigate('/payments')} className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5">All <ChevronRight className="w-3 h-3" /></button>
            </div>
            {(!pendingCollections || pendingCollections.length === 0) ? (
              <div className="py-8 text-center"><CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" /><p className="text-sm text-gray-500">All fees collected!</p></div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingCollections.slice(0, 5).map(({ client, pending, daysOutstanding }) => (
                  <div key={client.id} onClick={() => navigate(`/clients/${client.id}`)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors">
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{client.name}</p>
                      <p className="text-xs text-gray-400">{daysOutstanding}d outstanding</p>
                    </div>
                    <span className="text-sm font-semibold text-red-600 flex-shrink-0">{formatCurrency(pending)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Tasks + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Tasks */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-orange-500" /><h2 className="text-base font-semibold text-gray-900">Urgent Tasks</h2></div>
            <Badge variant="outline" className="text-xs text-orange-600 border-orange-200 bg-orange-50">
              {enrichedTasks?.length ?? 0} pending
            </Badge>
          </div>
          {(!enrichedTasks || enrichedTasks.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-400 mb-3" />
              <p className="text-gray-600 font-medium">No urgent tasks</p>
              <p className="text-gray-400 text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {enrichedTasks.map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-5 py-3.5 group">
                  <button onClick={async () => { if (task.id) { await updateTask(task.id, { status: 'Completed' }); toast({ title: 'Task completed' }) } }}
                    className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 hover:bg-green-500 flex items-center justify-center flex-shrink-0 transition-colors group-hover:scale-110">
                    <CheckCircle2 className="w-3 h-3 text-transparent group-hover:text-white" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge className={`text-xs px-1.5 py-0 border ${getTaskPriorityColor(task.priority)}`}>{task.priority}</Badge>
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      {task.caseName && <span className="truncate">{task.caseName}</span>}
                      {task.dueDate && <><span>·</span><span>Due {formatDate(task.dueDate)}</span></>}
                    </div>
                  </div>
                  <button onClick={async () => { if (task.id) { await updateTask(task.id, { status: 'Completed' }); toast({ title: 'Task marked complete' }) } }}
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-xs text-green-600 hover:text-green-700 font-medium bg-green-50 hover:bg-green-100 px-2.5 py-1 rounded-lg transition-all">
                    Done
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <Clock className="w-5 h-5 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          </div>
          {(!enrichedTimeline || enrichedTimeline.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No recent activity</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {enrichedTimeline.map((entry, i) => (
                <div key={entry.id ?? i} onClick={() => entry.caseId && entry.clientId && navigate(`/clients/${entry.clientId}/cases/${entry.caseId}`)}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-sm">{getTimelineIcon(entry.type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{entry.title}</p>
                    {entry.description && <p className="text-xs text-gray-500 truncate mt-0.5">{entry.description}</p>}
                    <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
                      <span>{(entry as any).clientName}</span>
                      <span>·</span>
                      <span>{timeAgo(entry.createdAt)}</span>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Modals */}
      {openModal && (
        <Dialog open={!!openModal} onOpenChange={open => !open && setOpenModal(null)}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{modalMeta[openModal].title}</DialogTitle>
              <DialogDescription>{modalMeta[openModal].description}</DialogDescription>
            </DialogHeader>
            {openModal === 'client' && <AddClientModal onClose={() => setOpenModal(null)} />}
            {openModal === 'case' && <AddCaseModal onClose={() => setOpenModal(null)} />}
            {openModal === 'hearing' && <AddHearingModal onClose={() => setOpenModal(null)} />}
            {openModal === 'note' && <AddNoteModal onClose={() => setOpenModal(null)} />}
            {openModal === 'payment' && <AddPaymentModal onClose={() => setOpenModal(null)} />}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
