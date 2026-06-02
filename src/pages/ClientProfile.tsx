import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft, Edit2, Trash2, Phone, Mail, MapPin, Briefcase,
  IndianRupee, CheckCircle2, TrendingDown, MessageSquare,
  Phone as PhoneIcon, Users, Calendar, FileText, Plus, Save, X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  useClient, useClientCases, useClientPayments, useClientCommunications,
  useCaseVariableCharges, updateClient, deleteClient, addCommunication,
} from '@/hooks/useDB'
import { db } from '@/db/database'
import {
  formatCurrency, formatDate, formatDateTime, getCaseStatusColor,
  getInitials, COMMUNICATION_TYPES,
} from '@/lib/utils'

// Comm type icon
function commIcon(type: string) {
  switch (type) {
    case 'Call': return '📞'
    case 'Meeting': return '🤝'
    case 'WhatsApp': return '💬'
    case 'Email': return '📧'
    default: return '📋'
  }
}

// Per-case financial hook
function useCaseFinancials(caseId: number | undefined) {
  const charges = useCaseVariableCharges(caseId)
  return charges
}

export default function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const id = clientId ? Number(clientId) : undefined

  const client = useClient(id)
  const cases = useClientCases(id) ?? []
  const payments = useClientPayments(id) ?? []
  const communications = useClientCommunications(id) ?? []

  const [editMode, setEditMode] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [showAddComm, setShowAddComm] = useState(false)
  const [editForm, setEditForm] = useState({ name: '', mobile: '', email: '', address: '', notes: '' })
  const [commForm, setCommForm] = useState({ type: 'Call' as const, content: '', date: new Date().toISOString().split('T')[0] })
  const [commLoading, setCommLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Compute financials from all cases
  const financials = useLiveQuery(async () => {
    if (!id) return { totalFees: 0, collected: 0, pending: 0, totalCases: 0 }
    const [clientCases, allPayments, allVariableCharges] = await Promise.all([
      db.cases.where('clientId').equals(id).toArray(),
      db.payments.where('clientId').equals(id).toArray(),
      db.variableCharges.toArray(),
    ])
    let totalFees = 0
    for (const c of clientCases) {
      totalFees += c.fixedFee
      totalFees += allVariableCharges.filter(v => v.caseId === c.id).reduce((s, v) => s + v.amount, 0)
    }
    const collected = allPayments.reduce((s, p) => s + p.amount, 0)
    return { totalFees, collected, pending: Math.max(0, totalFees - collected), totalCases: clientCases.length }
  }, [id])

  // Per-case pending fees
  const caseFinancials = useLiveQuery(async () => {
    if (!id) return {}
    const [clientCases, allPayments, allVariableCharges] = await Promise.all([
      db.cases.where('clientId').equals(id).toArray(),
      db.payments.toArray(),
      db.variableCharges.toArray(),
    ])
    const result: Record<number, { total: number; collected: number; pending: number; nextHearing?: Date }> = {}
    for (const c of clientCases) {
      if (!c.id) continue
      const totalFee = c.fixedFee + allVariableCharges.filter(v => v.caseId === c.id).reduce((s, v) => s + v.amount, 0)
      const collected = allPayments.filter(p => p.caseId === c.id).reduce((s, p) => s + p.amount, 0)
      result[c.id] = { total: totalFee, collected, pending: Math.max(0, totalFee - collected), nextHearing: c.nextHearingDate }
    }
    return result
  }, [id])

  function startEdit() {
    if (!client) return
    setEditForm({ name: client.name, mobile: client.mobile, email: client.email ?? '', address: client.address ?? '', notes: client.notes ?? '' })
    setEditMode(true)
  }

  async function saveEdit() {
    if (!id || !editForm.name.trim() || !editForm.mobile.trim()) return
    setEditLoading(true)
    try {
      await updateClient(id, { name: editForm.name.trim(), mobile: editForm.mobile.trim(), email: editForm.email.trim() || undefined, address: editForm.address.trim() || undefined, notes: editForm.notes.trim() || undefined })
      toast({ title: 'Client updated' })
      setEditMode(false)
    } catch { toast({ title: 'Error', description: 'Failed to update client.', variant: 'destructive' }) }
    finally { setEditLoading(false) }
  }

  async function handleDelete() {
    if (!id) return
    setDeleteLoading(true)
    try {
      await deleteClient(id)
      toast({ title: 'Client deleted' })
      navigate('/clients')
    } catch { toast({ title: 'Error', description: 'Failed to delete client.', variant: 'destructive' }) }
    finally { setDeleteLoading(false) }
  }

  async function submitComm(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !commForm.content.trim()) return
    setCommLoading(true)
    try {
      await addCommunication({ clientId: id, type: commForm.type, content: commForm.content.trim(), date: new Date(commForm.date) })
      toast({ title: 'Communication logged' })
      setCommForm({ type: 'Call', content: '', date: new Date().toISOString().split('T')[0] })
      setShowAddComm(false)
    } catch { toast({ title: 'Error', description: 'Failed to log communication.', variant: 'destructive' }) }
    finally { setCommLoading(false) }
  }

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">Client not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate('/clients')}>Back to Clients</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Back Button — always visible and touch-friendly */}
      <button
        onClick={() => navigate('/clients')}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />Back to Clients
      </button>

      {/* Client Header Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-6">
        {editMode ? (
          <div className="space-y-4">
            <h2 className="text-base md:text-lg font-semibold text-gray-900">Edit Client</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>Full Name *</Label><Input className="mt-1" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} /></div>
              <div><Label>Mobile *</Label><Input className="mt-1" value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} /></div>
              <div><Label>Email</Label><Input className="mt-1" type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} /></div>
              <div><Label>Address</Label><Input className="mt-1" value={editForm.address} onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))} /></div>
              <div className="md:col-span-2"><Label>Notes</Label><Textarea className="mt-1 min-h-[70px]" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={saveEdit} disabled={editLoading} className="bg-blue-600 hover:bg-blue-700 min-h-[44px]">
                <Save className="w-4 h-4 mr-1.5" />{editLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button variant="outline" onClick={() => setEditMode(false)} className="min-h-[44px]">
                <X className="w-4 h-4 mr-1.5" />Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Avatar + name — stacked on mobile, row on md+ */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex items-start gap-4">
                <Avatar className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-xl md:text-2xl font-bold">
                    {getInitials(client.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-xl md:text-2xl font-bold text-gray-900">{client.name}</h1>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 mt-2">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <a href={`tel:${client.mobile}`} className="hover:text-blue-600">{client.mobile}</a>
                    </div>
                    {client.email && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <a href={`mailto:${client.email}`} className="hover:text-blue-600 truncate max-w-[200px]">{client.email}</a>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate max-w-[200px]">{client.address}</span>
                      </div>
                    )}
                  </div>
                  {client.notes && <p className="text-sm text-gray-500 mt-2 italic">{client.notes}</p>}
                  <p className="text-xs text-gray-400 mt-2">Client since {formatDate(client.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 sm:flex-shrink-0">
                <Button variant="outline" size="sm" onClick={startEdit} className="min-h-[44px]">
                  <Edit2 className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Edit</span>
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 min-h-[44px]" onClick={() => setShowDelete(true)}>
                  <Trash2 className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Financial Summary — 2 cols on mobile, 4 on md+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Cases', value: financials?.totalCases ?? 0, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-100' },
          { label: 'Total Fees', value: formatCurrency(financials?.totalFees ?? 0), icon: IndianRupee, color: 'text-gray-600', bg: 'bg-gray-100' },
          { label: 'Collected', value: formatCurrency(financials?.collected ?? 0), icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100' },
          { label: 'Pending', value: formatCurrency(financials?.pending ?? 0), icon: TrendingDown, color: (financials?.pending ?? 0) > 0 ? 'text-red-600' : 'text-green-600', bg: (financials?.pending ?? 0) > 0 ? 'bg-red-100' : 'bg-green-100' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 md:p-4 flex items-center gap-2 md:gap-3">
            <div className={`w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
              <Icon className={`w-4 h-4 md:w-5 md:h-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 leading-tight">{label}</p>
              <p className="text-base md:text-xl font-bold text-gray-900 leading-tight truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Active Cases */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 md:w-5 md:h-5 text-blue-500" />
            <h2 className="text-sm md:text-base font-semibold text-gray-900">Cases ({cases.length})</h2>
          </div>
        </div>
        {cases.length === 0 ? (
          <div className="py-10 md:py-12 text-center">
            <Briefcase className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No cases yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {cases.map(c => {
              const cf = caseFinancials?.[c.id!]
              return (
                <div key={c.id} onClick={() => navigate(`/clients/${clientId}/cases/${c.id}`)}
                  className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors text-sm md:text-base">{c.title}</span>
                      {c.caseNumber && <span className="text-xs text-gray-400 font-mono hidden sm:inline">#{c.caseNumber}</span>}
                      <Badge className={`text-xs ${getCaseStatusColor(c.status)}`}>{c.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                      <span>{c.courtName}</span>
                      <span>·</span>
                      <span>{c.caseType}</span>
                      {cf?.nextHearing && <><span>·</span><span className="text-blue-600 font-medium">Next: {formatDate(cf.nextHearing)}</span></>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {cf && cf.pending > 0 ? (
                      <>
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(cf.pending)}</p>
                        <p className="text-xs text-gray-400">pending</p>
                      </>
                    ) : cf ? (
                      <span className="text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">Paid</span>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Communication History */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-purple-500" />
            <h2 className="text-sm md:text-base font-semibold text-gray-900">Communication History ({communications.length})</h2>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAddComm(true)} className="min-h-[44px]">
            <Plus className="w-4 h-4 mr-1.5" />Add
          </Button>
        </div>

        {/* Add Communication Inline Form */}
        {showAddComm && (
          <div className="px-4 md:px-5 py-4 bg-blue-50 border-b border-blue-100">
            <form onSubmit={submitComm} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Type</Label>
                  <Select value={commForm.type} onValueChange={(v: any) => setCommForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger className="mt-1 h-10 bg-white text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>{COMMUNICATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Date</Label>
                  <Input className="mt-1 h-10 bg-white text-sm" type="date" value={commForm.date} onChange={e => setCommForm(f => ({ ...f, date: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Details *</Label>
                <Textarea className="mt-1 min-h-[70px] bg-white text-sm" placeholder="Notes about this communication..." value={commForm.content} onChange={e => setCommForm(f => ({ ...f, content: e.target.value }))} required />
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={commLoading} className="bg-blue-600 hover:bg-blue-700 min-h-[44px]">{commLoading ? 'Saving...' : 'Log Communication'}</Button>
                <Button type="button" size="sm" variant="outline" onClick={() => setShowAddComm(false)} className="min-h-[44px]">Cancel</Button>
              </div>
            </form>
          </div>
        )}

        {communications.length === 0 && !showAddComm ? (
          <div className="py-10 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No communications logged</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAddComm(true)}><Plus className="w-4 h-4 mr-1.5" />Log first communication</Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {communications.map(comm => (
              <div key={comm.id} className="flex items-start gap-3 md:gap-4 px-4 md:px-5 py-4">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg md:text-xl">{commIcon(comm.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="text-xs">{comm.type}</Badge>
                    <span className="text-xs text-gray-400">{formatDateTime(comm.date)}</span>
                  </div>
                  <p className="text-sm text-gray-700">{comm.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm */}
      <Dialog open={showDelete} onOpenChange={open => !open && setShowDelete(false)}>
        <DialogContent className="max-w-[100vw] w-full sm:max-w-sm rounded-none sm:rounded-xl h-auto">
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{client.name}</strong>? This will also delete all associated cases, hearings, payments, and documents. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteLoading}>
              {deleteLoading ? 'Deleting...' : 'Delete Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
