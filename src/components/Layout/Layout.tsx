import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useClients, useCases, addClient, addCase, addHearing, addNote, addPayment } from '@/hooks/useDB'
import { CASE_TYPES, CASE_STATUSES, HEARING_STATUSES, PAYMENT_MODES } from '@/lib/utils'

type ModalType = 'client' | 'case' | 'hearing' | 'note' | 'payment' | null

// ── Add Client Form ───────────────────────────────────────────────────────

interface AddClientFormProps {
  onClose: () => void
}

function AddClientModal({ onClose }: AddClientFormProps) {
  const { toast } = useToast()
  const [form, setForm] = useState({
    name: '',
    mobile: '',
    email: '',
    address: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim()) return
    setLoading(true)
    try {
      await addClient({
        name: form.name.trim(),
        mobile: form.mobile.trim(),
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        notes: form.notes.trim() || undefined,
      })
      toast({ title: 'Client added', description: `${form.name} has been added successfully.` })
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Failed to add client.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label htmlFor="client-name">Full Name *</Label>
          <Input
            id="client-name"
            placeholder="Ramesh Kumar"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="client-mobile">Mobile *</Label>
          <Input
            id="client-mobile"
            placeholder="9876543210"
            value={form.mobile}
            onChange={(e) => setForm((f) => ({ ...f, mobile: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="client-email">Email</Label>
          <Input
            id="client-email"
            type="email"
            placeholder="email@example.com"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="client-address">Address</Label>
          <Input
            id="client-address"
            placeholder="Street, City"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="client-notes">Notes</Label>
          <Textarea
            id="client-notes"
            placeholder="Any additional notes..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 min-h-[70px]"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Client'}</Button>
      </DialogFooter>
    </form>
  )
}

// ── Add Case Form ────────────────────────────────────────────────────────

function AddCaseModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const [form, setForm] = useState({
    clientId: '',
    title: '',
    caseNumber: '',
    caseType: '',
    courtName: '',
    oppositeParty: '',
    status: 'Filed',
    fixedFee: '',
    notes: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.clientId || !form.title.trim() || !form.caseType || !form.courtName.trim()) return
    setLoading(true)
    try {
      await addCase({
        clientId: Number(form.clientId),
        title: form.title.trim(),
        caseNumber: form.caseNumber.trim() || undefined,
        caseType: form.caseType,
        courtName: form.courtName.trim(),
        oppositeParty: form.oppositeParty.trim() || undefined,
        status: form.status,
        fixedFee: Number(form.fixedFee) || 0,
        notes: form.notes.trim() || undefined,
      })
      toast({ title: 'Case added', description: `${form.title} has been added.` })
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Failed to add case.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Client *</Label>
          <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Case Title *</Label>
          <Input
            placeholder="e.g. Sharma vs State"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label>Case Number</Label>
          <Input
            placeholder="CNR/CC No."
            value={form.caseNumber}
            onChange={(e) => setForm((f) => ({ ...f, caseNumber: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Case Type *</Label>
          <Select value={form.caseType} onValueChange={(v) => setForm((f) => ({ ...f, caseType: v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {CASE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Court Name *</Label>
          <Input
            placeholder="District Court, Mumbai"
            value={form.courtName}
            onChange={(e) => setForm((f) => ({ ...f, courtName: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Opposite Party</Label>
          <Input
            placeholder="Name"
            value={form.oppositeParty}
            onChange={(e) => setForm((f) => ({ ...f, oppositeParty: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Fixed Fee (₹)</Label>
          <Input
            type="number"
            min="0"
            placeholder="0"
            value={form.fixedFee}
            onChange={(e) => setForm((f) => ({ ...f, fixedFee: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div className="col-span-2">
          <Label>Notes</Label>
          <Textarea
            placeholder="Case notes..."
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="mt-1 min-h-[60px]"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.clientId || !form.caseType}>
          {loading ? 'Adding...' : 'Add Case'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Add Hearing Form ─────────────────────────────────────────────────────

function AddHearingModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const [form, setForm] = useState({
    clientId: '',
    caseId: '',
    date: '',
    time: '10:00',
    courtNumber: '',
    judgeName: '',
    remarks: '',
    status: 'Scheduled' as 'Scheduled' | 'Completed' | 'Adjourned' | 'Cancelled',
  })
  const [loading, setLoading] = useState(false)

  const clientCases = cases.filter((c) => String(c.clientId) === form.clientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caseId || !form.date || !form.time) return
    const selectedCase = cases.find((c) => String(c.id) === form.caseId)
    if (!selectedCase) return
    setLoading(true)
    try {
      await addHearing({
        caseId: Number(form.caseId),
        clientId: selectedCase.clientId,
        date: new Date(form.date),
        time: form.time,
        courtNumber: form.courtNumber.trim() || undefined,
        judgeName: form.judgeName.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        status: form.status,
      })
      toast({ title: 'Hearing added', description: 'Hearing scheduled successfully.' })
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Failed to add hearing.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Client *</Label>
          <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v, caseId: '' }))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Case *</Label>
          <Select value={form.caseId} onValueChange={(v) => setForm((f) => ({ ...f, caseId: v }))} disabled={!form.clientId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select case" />
            </SelectTrigger>
            <SelectContent>
              {clientCases.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Date *</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label>Time *</Label>
          <Input
            type="time"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label>Court Number</Label>
          <Input
            placeholder="Court No. 5"
            value={form.courtNumber}
            onChange={(e) => setForm((f) => ({ ...f, courtNumber: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Judge Name</Label>
          <Input
            placeholder="Hon. Justice..."
            value={form.judgeName}
            onChange={(e) => setForm((f) => ({ ...f, judgeName: e.target.value }))}
            className="mt-1"
          />
        </div>
        <div>
          <Label>Status</Label>
          <Select
            value={form.status}
            onValueChange={(v) => setForm((f) => ({ ...f, status: v as typeof form.status }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {HEARING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Remarks</Label>
          <Textarea
            placeholder="Any remarks..."
            value={form.remarks}
            onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            className="mt-1 min-h-[60px]"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.caseId || !form.date}>
          {loading ? 'Adding...' : 'Add Hearing'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Add Note Form ────────────────────────────────────────────────────────

function AddNoteModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const [form, setForm] = useState({ clientId: '', caseId: '', content: '' })
  const [loading, setLoading] = useState(false)

  const clientCases = cases.filter((c) => String(c.clientId) === form.clientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caseId || !form.content.trim()) return
    const selectedCase = cases.find((c) => String(c.id) === form.caseId)
    if (!selectedCase) return
    setLoading(true)
    try {
      await addNote({
        caseId: Number(form.caseId),
        clientId: selectedCase.clientId,
        content: form.content.trim(),
        date: new Date(),
      })
      toast({ title: 'Note added' })
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Failed to add note.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Client *</Label>
          <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v, caseId: '' }))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Case *</Label>
          <Select value={form.caseId} onValueChange={(v) => setForm((f) => ({ ...f, caseId: v }))} disabled={!form.clientId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select case" />
            </SelectTrigger>
            <SelectContent>
              {clientCases.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Note *</Label>
          <Textarea
            placeholder="Write your note here..."
            value={form.content}
            onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
            required
            className="mt-1 min-h-[100px]"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.caseId || !form.content.trim()}>
          {loading ? 'Adding...' : 'Add Note'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Add Payment Form ─────────────────────────────────────────────────────

function AddPaymentModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const [form, setForm] = useState({
    clientId: '',
    caseId: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash' as 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other',
    remarks: '',
  })
  const [loading, setLoading] = useState(false)

  const clientCases = cases.filter((c) => String(c.clientId) === form.clientId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.caseId || !form.amount || !form.date) return
    const selectedCase = cases.find((c) => String(c.id) === form.caseId)
    if (!selectedCase) return
    setLoading(true)
    try {
      await addPayment({
        caseId: Number(form.caseId),
        clientId: selectedCase.clientId,
        amount: Number(form.amount),
        date: new Date(form.date),
        paymentMode: form.paymentMode,
        remarks: form.remarks.trim() || undefined,
      })
      toast({ title: 'Payment recorded', description: `₹${Number(form.amount).toLocaleString('en-IN')} recorded.` })
      onClose()
    } catch {
      toast({ title: 'Error', description: 'Failed to add payment.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Client *</Label>
          <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v, caseId: '' }))}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Case *</Label>
          <Select value={form.caseId} onValueChange={(v) => setForm((f) => ({ ...f, caseId: v }))} disabled={!form.clientId}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select case" />
            </SelectTrigger>
            <SelectContent>
              {clientCases.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Amount (₹) *</Label>
          <Input
            type="number"
            min="1"
            placeholder="5000"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label>Date *</Label>
          <Input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
            className="mt-1"
          />
        </div>
        <div>
          <Label>Payment Mode</Label>
          <Select
            value={form.paymentMode}
            onValueChange={(v) => setForm((f) => ({ ...f, paymentMode: v as typeof form.paymentMode }))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Remarks</Label>
          <Input
            placeholder="Optional remarks"
            value={form.remarks}
            onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))}
            className="mt-1"
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.caseId || !form.amount}>
          {loading ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogFooter>
    </form>
  )
}

// ── Modal titles ─────────────────────────────────────────────────────────

const modalMeta: Record<NonNullable<ModalType>, { title: string; description: string }> = {
  client: { title: 'Add New Client', description: 'Enter client details to create a new profile.' },
  case: { title: 'Add New Case', description: 'Create a new case for an existing client.' },
  hearing: { title: 'Add Hearing', description: 'Schedule a new court hearing.' },
  note: { title: 'Add Note', description: 'Attach a note to a case.' },
  payment: { title: 'Record Payment', description: 'Record a fee payment from a client.' },
}

// ── Layout ───────────────────────────────────────────────────────────────

export default function Layout() {
  const [openModal, setOpenModal] = useState<ModalType>(null)

  const closeModal = () => setOpenModal(null)

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      {/* Main content — offset by sidebar on desktop */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen overflow-hidden">
        <Header
          onAddClient={() => setOpenModal('client')}
          onAddCase={() => setOpenModal('case')}
          onAddHearing={() => setOpenModal('hearing')}
          onAddNote={() => setOpenModal('note')}
          onAddPayment={() => setOpenModal('payment')}
        />
        {/* pb-16 reserves space for bottom nav on mobile */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Bottom navigation for mobile */}
      <BottomNav />

      {/* Global Modals */}
      {openModal && (
        <Dialog open={!!openModal} onOpenChange={(open) => !open && closeModal()}>
          <DialogContent className="max-w-[100vw] w-full sm:max-w-lg h-full sm:h-auto rounded-none sm:rounded-xl overflow-y-auto sm:max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{modalMeta[openModal].title}</DialogTitle>
              <DialogDescription>{modalMeta[openModal].description}</DialogDescription>
            </DialogHeader>
            {openModal === 'client' && <AddClientModal onClose={closeModal} />}
            {openModal === 'case' && <AddCaseModal onClose={closeModal} />}
            {openModal === 'hearing' && <AddHearingModal onClose={closeModal} />}
            {openModal === 'note' && <AddNoteModal onClose={closeModal} />}
            {openModal === 'payment' && <AddPaymentModal onClose={closeModal} />}
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
