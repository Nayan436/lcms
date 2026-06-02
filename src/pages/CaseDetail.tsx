import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ArrowLeft, Edit2, Save, X, Plus, Trash2, CheckCircle2, Circle,
  FileText, Calendar, IndianRupee, CheckSquare, MessageSquare,
  Clock, ChevronDown, Upload, Check, AlertTriangle, Download,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  useClient, useCase, useCaseTimeline, useCaseHearings, useCaseDocuments,
  useCasePayments, useCaseVariableCharges, usePendingTasks, useClientCommunications,
  updateCase, addHearing, addNote, addDocument, toggleDocument, deleteDocument,
  addPayment, addVariableCharge, addTask, updateTask, deleteTask, addCommunication,
  updateHearing,
} from '@/hooks/useDB'
import {
  formatCurrency, formatDate, formatDateTime, formatTime, timeAgo,
  getCaseStatusColor, getHearingStatusColor, getTaskPriorityColor,
  getTimelineIcon, CASE_STATUSES, HEARING_STATUSES, PAYMENT_MODES,
  DOCUMENT_CATEGORIES, COMMUNICATION_TYPES, TASK_PRIORITIES,
} from '@/lib/utils'
import { format, isAfter, startOfDay } from 'date-fns'

function commIcon(type: string) {
  switch (type) {
    case 'Call': return '📞'; case 'Meeting': return '🤝'
    case 'WhatsApp': return '💬'; case 'Email': return '📧'
    default: return '📋'
  }
}

// ─── Timeline Tab ────────────────────────────────────────────────────────────
function TimelineTab({ caseId, clientId }: { caseId: number; clientId: number }) {
  const { toast } = useToast()
  const timeline = useCaseTimeline(caseId) ?? []
  const [noteContent, setNoteContent] = useState('')
  const [loading, setLoading] = useState(false)

  // Group by date
  const grouped = timeline.reduce<Record<string, typeof timeline>>((acc, entry) => {
    const key = format(new Date(entry.date), 'yyyy-MM-dd')
    if (!acc[key]) acc[key] = []
    acc[key].push(entry)
    return acc
  }, {})
  const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a))

  async function submitNote(e: React.FormEvent) {
    e.preventDefault()
    if (!noteContent.trim()) return
    setLoading(true)
    try {
      await addNote({ caseId, clientId, content: noteContent.trim(), date: new Date() })
      setNoteContent('')
      toast({ title: 'Note added' })
    } catch { toast({ title: 'Error', description: 'Failed to add note.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Quick Note Form */}
      <form onSubmit={submitNote} className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <Label className="text-sm font-semibold text-blue-800 mb-2 block">Add Note</Label>
        <Textarea
          value={noteContent}
          onChange={e => setNoteContent(e.target.value)}
          placeholder="Write a note about this case..."
          className="bg-white min-h-[80px] text-sm mb-3 border-blue-200"
        />
        <Button type="submit" size="sm" disabled={loading || !noteContent.trim()} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-1.5" />{loading ? 'Adding...' : 'Add Note'}
        </Button>
      </form>

      {/* Timeline Entries */}
      {sortedDates.length === 0 ? (
        <div className="py-12 text-center">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No timeline entries yet</p>
        </div>
      ) : (
        sortedDates.map(dateKey => (
          <div key={dateKey}>
            <div className="flex items-center gap-3 mb-3">
              <Separator className="flex-1" />
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide whitespace-nowrap">
                {format(new Date(dateKey), 'dd MMMM yyyy')}
              </span>
              <Separator className="flex-1" />
            </div>
            <div className="space-y-3">
              {grouped[dateKey].map((entry, i) => (
                <div key={entry.id ?? i} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-gray-100 border-2 border-white shadow-sm flex items-center justify-center flex-shrink-0 text-base mt-0.5">
                    {getTimelineIcon(entry.type)}
                  </div>
                  <div className="flex-1 bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{entry.title}</p>
                        {entry.description && <p className="text-sm text-gray-600 mt-1">{entry.description}</p>}
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0 whitespace-nowrap">{timeAgo(entry.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

// ─── Hearings Tab ────────────────────────────────────────────────────────────
function HearingsTab({ caseId, clientId }: { caseId: number; clientId: number }) {
  const { toast } = useToast()
  const hearings = useCaseHearings(caseId) ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ date: '', time: '10:00', courtNumber: '', judgeName: '', remarks: '', status: 'Scheduled' as const })
  const [loading, setLoading] = useState(false)
  const today = startOfDay(new Date())

  const upcoming = hearings.filter(h => isAfter(new Date(h.date), today) || format(new Date(h.date), 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd'))
  const past = hearings.filter(h => !isAfter(new Date(h.date), today) && format(new Date(h.date), 'yyyy-MM-dd') !== format(today, 'yyyy-MM-dd'))

  async function submitHearing(e: React.FormEvent) {
    e.preventDefault()
    if (!form.date) return
    setLoading(true)
    try {
      await addHearing({ caseId, clientId, date: new Date(form.date), time: form.time, courtNumber: form.courtNumber.trim() || undefined, judgeName: form.judgeName.trim() || undefined, remarks: form.remarks.trim() || undefined, status: form.status })
      setForm({ date: '', time: '10:00', courtNumber: '', judgeName: '', remarks: '', status: 'Scheduled' })
      setShowAdd(false)
      toast({ title: 'Hearing scheduled' })
    } catch { toast({ title: 'Error', description: 'Failed to add hearing.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  function HearingCard({ h, highlight }: { h: typeof hearings[0]; highlight?: boolean }) {
    const [editStatus, setEditStatus] = useState(false)
    return (
      <div className={`p-4 rounded-xl border ${highlight ? 'border-blue-200 bg-blue-50' : 'border-gray-100 bg-white'} shadow-sm`}>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {highlight && <span className="text-xs font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">Next Hearing</span>}
              <span className="font-semibold text-gray-900">{formatDate(h.date)}</span>
              <span className="text-gray-500">at</span>
              <span className="font-semibold text-gray-900">{formatTime(h.time)}</span>
            </div>
            <div className="flex flex-wrap gap-3 text-sm text-gray-600">
              {h.courtNumber && <span>Court: {h.courtNumber}</span>}
              {h.judgeName && <span>Judge: {h.judgeName}</span>}
              {h.remarks && <span className="italic text-gray-500">{h.remarks}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`text-xs border ${getHearingStatusColor(h.status)}`}>{h.status}</Badge>
            <button onClick={() => setEditStatus(s => !s)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${editStatus ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
        {editStatus && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
            <span className="text-xs text-gray-500 font-medium">Update status:</span>
            {HEARING_STATUSES.map(s => (
              <button key={s} onClick={async () => { if (h.id) { await updateHearing(h.id, { status: s as any }); setEditStatus(false); toast({ title: 'Status updated' }) } }}
                className={`text-xs px-2.5 py-1 rounded-full border font-medium transition-colors ${h.status === s ? getHearingStatusColor(s) + ' border-current' : 'text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Add Hearing Button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(s => !s)} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />Add Hearing
        </Button>
      </div>

      {/* Add Hearing Form */}
      {showAdd && (
        <form onSubmit={submitHearing} className="bg-green-50 rounded-xl border border-green-100 p-4 space-y-4">
          <h3 className="font-semibold text-green-800 text-sm">Schedule New Hearing</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Date *</Label><Input className="mt-1 h-9 bg-white text-sm" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required /></div>
            <div><Label className="text-xs">Time *</Label><Input className="mt-1 h-9 bg-white text-sm" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required /></div>
            <div><Label className="text-xs">Court Number</Label><Input className="mt-1 h-9 bg-white text-sm" placeholder="Court No. 5" value={form.courtNumber} onChange={e => setForm(f => ({ ...f, courtNumber: e.target.value }))} /></div>
            <div><Label className="text-xs">Judge Name</Label><Input className="mt-1 h-9 bg-white text-sm" placeholder="Hon. Justice..." value={form.judgeName} onChange={e => setForm(f => ({ ...f, judgeName: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Remarks</Label><Input className="mt-1 h-9 bg-white text-sm" placeholder="Optional remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading || !form.date} className="bg-green-600 hover:bg-green-700">{loading ? 'Adding...' : 'Schedule Hearing'}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {hearings.length === 0 ? (
        <div className="py-12 text-center">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hearings scheduled</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1.5" />Schedule First Hearing</Button>
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Upcoming</h3>
              <div className="space-y-3">
                {upcoming.map((h, i) => <HearingCard key={h.id} h={h} highlight={i === 0} />)}
              </div>
            </div>
          )}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Past Hearings</h3>
              <div className="space-y-3 opacity-80">
                {[...past].reverse().map(h => <HearingCard key={h.id} h={h} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Documents Tab ───────────────────────────────────────────────────────────
function DocumentsTab({ caseId, clientId }: { caseId: number; clientId: number }) {
  const { toast } = useToast()
  const documents = useCaseDocuments(caseId) ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ name: '', category: 'Other' })
  const [fileData, setFileData] = useState<{ buffer: ArrayBuffer; type: string; size: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const checked = documents.filter(d => d.checked).length
  const progress = documents.length > 0 ? Math.round((checked / documents.length) * 100) : 0

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const buffer = await file.arrayBuffer()
    setFileData({ buffer, type: file.type, size: file.size })
    if (!form.name) setForm(f => ({ ...f, name: file.name }))
  }

  async function submitDocument(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setLoading(true)
    try {
      await addDocument({ caseId, clientId, name: form.name.trim(), category: form.category, checked: false, fileData: fileData?.buffer, fileType: fileData?.type, fileSize: fileData?.size })
      setForm({ name: '', category: 'Other' })
      setFileData(null)
      if (fileRef.current) fileRef.current.value = ''
      setShowAdd(false)
      toast({ title: 'Document added' })
    } catch { toast({ title: 'Error', description: 'Failed to add document.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Progress */}
      {documents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Document Checklist</span>
            <span className="text-sm font-semibold text-gray-900">{checked}/{documents.length} checked</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{progress}% complete</p>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(s => !s)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1.5" />Add Document</Button>
      </div>

      {/* Add Document Form */}
      {showAdd && (
        <form onSubmit={submitDocument} className="bg-purple-50 rounded-xl border border-purple-100 p-4 space-y-3">
          <h3 className="font-semibold text-purple-800 text-sm">Add New Document</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Document Name *</Label><Input className="mt-1 h-9 bg-white text-sm" placeholder="e.g. FIR Copy" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required /></div>
            <div><Label className="text-xs">Category</Label>
              <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1 h-9 bg-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{DOCUMENT_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">File (optional)</Label>
              <input ref={fileRef} type="file" onChange={handleFileChange} className="mt-1 block w-full text-xs text-gray-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading || !form.name.trim()} className="bg-purple-600 hover:bg-purple-700">{loading ? 'Adding...' : 'Add Document'}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {documents.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No documents added</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowAdd(true)}><Plus className="w-4 h-4 mr-1.5" />Add First Document</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {[...DOCUMENT_CATEGORIES, ...Array.from(new Set(documents.map(d => d.category).filter(c => !DOCUMENT_CATEGORIES.includes(c))))].map(cat => {
            const catDocs = documents.filter(d => d.category === cat)
            if (!catDocs.length) return null
            return (
              <div key={cat}>
                <div className="px-4 py-2 bg-gray-50">
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{cat}</span>
                </div>
                {catDocs.map(doc => (
                  <div key={doc.id} className={`flex items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50/50 ${doc.checked ? 'bg-green-50/30' : ''}`}>
                    <Checkbox
                      id={`doc-${doc.id}`}
                      checked={doc.checked}
                      onCheckedChange={async (checked) => { if (doc.id) await toggleDocument(doc.id, !!checked) }}
                      className="flex-shrink-0"
                    />
                    <label htmlFor={`doc-${doc.id}`} className={`flex-1 text-sm cursor-pointer ${doc.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                      {doc.name}
                      {doc.fileSize && <span className="ml-2 text-xs text-gray-400">({(doc.fileSize / 1024).toFixed(1)} KB)</span>}
                    </label>
                    {doc.checked && <Check className="w-4 h-4 text-green-500 flex-shrink-0" />}
                    <button onClick={async () => { if (doc.id) { await deleteDocument(doc.id); toast({ title: 'Document removed' }) } }}
                      className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Payments Tab ────────────────────────────────────────────────────────────
function PaymentsTab({ caseId, clientId, fixedFee }: { caseId: number; clientId: number; fixedFee: number }) {
  const { toast } = useToast()
  const payments = useCasePayments(caseId) ?? []
  const variableCharges = useCaseVariableCharges(caseId) ?? []
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [showAddCharge, setShowAddCharge] = useState(false)
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: new Date().toISOString().split('T')[0], paymentMode: 'Cash' as const, remarks: '' })
  const [chargeForm, setChargeForm] = useState({ label: '', amount: '', date: new Date().toISOString().split('T')[0] })
  const [payLoading, setPayLoading] = useState(false)
  const [chargeLoading, setChargeLoading] = useState(false)

  const variableTotal = variableCharges.reduce((s, c) => s + c.amount, 0)
  const grandTotal = fixedFee + variableTotal
  const collected = payments.reduce((s, p) => s + p.amount, 0)
  const pending = Math.max(0, grandTotal - collected)

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!paymentForm.amount) return
    setPayLoading(true)
    try {
      await addPayment({ caseId, clientId, amount: Number(paymentForm.amount), date: new Date(paymentForm.date), paymentMode: paymentForm.paymentMode, remarks: paymentForm.remarks.trim() || undefined })
      setPaymentForm({ amount: '', date: new Date().toISOString().split('T')[0], paymentMode: 'Cash', remarks: '' })
      setShowAddPayment(false)
      toast({ title: 'Payment recorded' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setPayLoading(false) }
  }

  async function submitCharge(e: React.FormEvent) {
    e.preventDefault()
    if (!chargeForm.label.trim() || !chargeForm.amount) return
    setChargeLoading(true)
    try {
      await addVariableCharge({ caseId, label: chargeForm.label.trim(), amount: Number(chargeForm.amount), date: new Date(chargeForm.date) })
      setChargeForm({ label: '', amount: '', date: new Date().toISOString().split('T')[0] })
      setShowAddCharge(false)
      toast({ title: 'Charge added' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setChargeLoading(false) }
  }

  return (
    <div className="space-y-5">
      {/* Financial Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Fixed Fee', value: formatCurrency(fixedFee), cls: 'text-gray-900' },
          { label: 'Variable Charges', value: formatCurrency(variableTotal), cls: 'text-gray-900' },
          { label: 'Grand Total', value: formatCurrency(grandTotal), cls: 'text-gray-900 font-bold' },
          { label: 'Collected', value: formatCurrency(collected), cls: 'text-green-600 font-bold' },
          { label: 'Pending', value: formatCurrency(pending), cls: pending > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold' },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className={`text-lg ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Variable Charges */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">Variable Charges</span>
          <Button variant="outline" size="sm" onClick={() => setShowAddCharge(s => !s)}><Plus className="w-3.5 h-3.5 mr-1" />Add Charge</Button>
        </div>
        {showAddCharge && (
          <form onSubmit={submitCharge} className="px-4 py-3 bg-orange-50 border-b border-orange-100 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Label className="text-xs">Description *</Label><Input className="mt-1 h-9 bg-white text-sm" placeholder="e.g. Stamp Duty" value={chargeForm.label} onChange={e => setChargeForm(f => ({ ...f, label: e.target.value }))} required /></div>
              <div><Label className="text-xs">Amount (₹) *</Label><Input className="mt-1 h-9 bg-white text-sm" type="number" min="1" placeholder="0" value={chargeForm.amount} onChange={e => setChargeForm(f => ({ ...f, amount: e.target.value }))} required /></div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={chargeLoading} className="bg-orange-600 hover:bg-orange-700">{chargeLoading ? 'Adding...' : 'Add Charge'}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowAddCharge(false)}>Cancel</Button>
            </div>
          </form>
        )}
        {variableCharges.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">No variable charges added</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {variableCharges.map(vc => (
              <div key={vc.id} className="flex items-center justify-between px-4 py-3">
                <div><p className="text-sm font-medium text-gray-900">{vc.label}</p><p className="text-xs text-gray-400">{formatDate(vc.date)}</p></div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(vc.amount)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
              <span className="text-sm font-semibold text-gray-700">Total Variable</span>
              <span className="text-sm font-bold text-gray-900">{formatCurrency(variableTotal)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Payments List */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <span className="text-sm font-semibold text-gray-900">Payment History</span>
          <Button variant="outline" size="sm" onClick={() => setShowAddPayment(s => !s)}><Plus className="w-3.5 h-3.5 mr-1" />Add Payment</Button>
        </div>
        {showAddPayment && (
          <form onSubmit={submitPayment} className="px-4 py-3 bg-green-50 border-b border-green-100 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Amount (₹) *</Label><Input className="mt-1 h-9 bg-white text-sm" type="number" min="1" placeholder="5000" value={paymentForm.amount} onChange={e => setPaymentForm(f => ({ ...f, amount: e.target.value }))} required /></div>
              <div><Label className="text-xs">Date *</Label><Input className="mt-1 h-9 bg-white text-sm" type="date" value={paymentForm.date} onChange={e => setPaymentForm(f => ({ ...f, date: e.target.value }))} required /></div>
              <div><Label className="text-xs">Mode</Label>
                <Select value={paymentForm.paymentMode} onValueChange={(v: any) => setPaymentForm(f => ({ ...f, paymentMode: v }))}>
                  <SelectTrigger className="mt-1 h-9 bg-white text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-3"><Label className="text-xs">Remarks</Label><Input className="mt-1 h-9 bg-white text-sm" placeholder="Optional remarks" value={paymentForm.remarks} onChange={e => setPaymentForm(f => ({ ...f, remarks: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={payLoading} className="bg-green-600 hover:bg-green-700">{payLoading ? 'Recording...' : 'Record Payment'}</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setShowAddPayment(false)}>Cancel</Button>
            </div>
          </form>
        )}
        {payments.length === 0 ? (
          <div className="py-6 text-center text-sm text-gray-400">No payments recorded</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {[...payments].reverse().map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{formatCurrency(p.amount)}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="outline" className="text-xs">{p.paymentMode}</Badge>
                    <span className="text-xs text-gray-400">{formatDate(p.date)}</span>
                    {p.remarks && <span className="text-xs text-gray-400 italic">{p.remarks}</span>}
                  </div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              </div>
            ))}
            <div className="flex items-center justify-between px-4 py-3 bg-green-50">
              <span className="text-sm font-semibold text-gray-700">Total Collected</span>
              <span className="text-sm font-bold text-green-700">{formatCurrency(collected)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Tasks Tab ───────────────────────────────────────────────────────────────
function TasksTab({ caseId, clientId }: { caseId: number; clientId: number }) {
  const { toast } = useToast()
  const allTasks = usePendingTasks() ?? []
  const caseTasks = useLiveQuery(async () => {
    const { db: database } = await import('@/db/database')
    return database.tasks.where('caseId').equals(caseId).toArray()
  }, [caseId]) ?? []
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', priority: 'Medium' as const, dueDate: '' })
  const [loading, setLoading] = useState(false)

  async function submitTask(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
      await addTask({ caseId, clientId, title: form.title.trim(), description: form.description.trim() || undefined, priority: form.priority, status: 'Pending', dueDate: form.dueDate ? new Date(form.dueDate) : undefined })
      setForm({ title: '', description: '', priority: 'Medium', dueDate: '' })
      setShowAdd(false)
      toast({ title: 'Task added' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  const pending = caseTasks.filter(t => t.status !== 'Completed')
  const completed = caseTasks.filter(t => t.status === 'Completed')

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(s => !s)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1.5" />Add Task</Button>
      </div>

      {showAdd && (
        <form onSubmit={submitTask} className="bg-amber-50 rounded-xl border border-amber-100 p-4 space-y-3">
          <h3 className="font-semibold text-amber-800 text-sm">Add New Task</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label className="text-xs">Task Title *</Label><Input className="mt-1 h-9 bg-white text-sm" placeholder="e.g. File bail application" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required /></div>
            <div><Label className="text-xs">Priority</Label>
              <Select value={form.priority} onValueChange={(v: any) => setForm(f => ({ ...f, priority: v }))}>
                <SelectTrigger className="mt-1 h-9 bg-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{TASK_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Due Date</Label><Input className="mt-1 h-9 bg-white text-sm" type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea className="mt-1 min-h-[60px] bg-white text-sm" placeholder="Optional description..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading} className="bg-amber-600 hover:bg-amber-700">{loading ? 'Adding...' : 'Add Task'}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {caseTasks.length === 0 ? (
        <div className="py-12 text-center">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tasks for this case</p>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {pending.map(task => (
                <div key={task.id} className="flex items-center gap-3 px-4 py-3.5 group">
                  <button onClick={async () => { if (task.id) { await updateTask(task.id, { status: 'Completed' }); toast({ title: 'Task completed' }) } }}
                    className="w-5 h-5 rounded-full border-2 border-gray-300 hover:border-green-500 flex items-center justify-center flex-shrink-0 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full bg-transparent group-hover:bg-green-500 transition-colors" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge className={`text-xs px-1.5 py-0 border ${getTaskPriorityColor(task.priority)}`}>{task.priority}</Badge>
                      <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      {task.description && <span className="truncate">{task.description}</span>}
                      {task.dueDate && <span className={`font-medium ${new Date(task.dueDate) < new Date() ? 'text-red-500' : ''}`}>Due {formatDate(task.dueDate)}</span>}
                    </div>
                  </div>
                  <button onClick={async () => { if (task.id) { await deleteTask(task.id); toast({ title: 'Task deleted' }) } }}
                    className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {completed.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Completed ({completed.length})</p>
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50 opacity-60">
                {completed.map(task => (
                  <div key={task.id} className="flex items-center gap-3 px-4 py-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <p className="text-sm text-gray-500 line-through">{task.title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Communication Tab ───────────────────────────────────────────────────────
function CommunicationTab({ caseId, clientId }: { caseId: number; clientId: number }) {
  const { toast } = useToast()
  const comms = useClientCommunications(clientId) ?? []
  const caseComms = comms.filter(c => c.caseId === caseId || !c.caseId)
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ type: 'Call' as const, content: '', date: new Date().toISOString().split('T')[0] })
  const [loading, setLoading] = useState(false)

  async function submitComm(e: React.FormEvent) {
    e.preventDefault()
    if (!form.content.trim()) return
    setLoading(true)
    try {
      await addCommunication({ clientId, caseId, type: form.type, content: form.content.trim(), date: new Date(form.date) })
      setForm({ type: 'Call', content: '', date: new Date().toISOString().split('T')[0] })
      setShowAdd(false)
      toast({ title: 'Communication logged' })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setShowAdd(s => !s)} variant="outline" size="sm"><Plus className="w-4 h-4 mr-1.5" />Log Communication</Button>
      </div>

      {showAdd && (
        <form onSubmit={submitComm} className="bg-blue-50 rounded-xl border border-blue-100 p-4 space-y-3">
          <h3 className="font-semibold text-blue-800 text-sm">Log Communication</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Type *</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger className="mt-1 h-9 bg-white text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>{COMMUNICATION_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Date</Label><Input className="mt-1 h-9 bg-white text-sm" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
            <div className="col-span-2"><Label className="text-xs">Details *</Label><Textarea className="mt-1 min-h-[70px] bg-white text-sm" placeholder="Notes about this communication..." value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required /></div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={loading} className="bg-blue-600 hover:bg-blue-700">{loading ? 'Saving...' : 'Log Communication'}</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
          </div>
        </form>
      )}

      {caseComms.length === 0 ? (
        <div className="py-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No communications logged</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
          {caseComms.map(comm => (
            <div key={comm.id} className="flex items-start gap-4 px-4 py-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xl">{commIcon(comm.type)}</div>
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
  )
}

// ─── Main CaseDetail ─────────────────────────────────────────────────────────
export default function CaseDetail() {
  const { clientId, caseId } = useParams<{ clientId: string; caseId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  const cId = clientId ? Number(clientId) : undefined
  const csId = caseId ? Number(caseId) : undefined

  const client = useClient(cId)
  const caseData = useCase(csId)
  const variableCharges = useCaseVariableCharges(csId) ?? []
  const payments = useCasePayments(csId) ?? []

  const [editMode, setEditMode] = useState(false)
  const [editForm, setEditForm] = useState({ title: '', caseNumber: '', courtName: '', caseType: '', oppositeParty: '', status: '', fixedFee: '', notes: '' })
  const [editLoading, setEditLoading] = useState(false)
  const [statusChanging, setStatusChanging] = useState(false)

  const variableTotal = variableCharges.reduce((s, c) => s + c.amount, 0)
  const grandTotal = (caseData?.fixedFee ?? 0) + variableTotal
  const collected = payments.reduce((s, p) => s + p.amount, 0)
  const pending = Math.max(0, grandTotal - collected)

  function startEdit() {
    if (!caseData) return
    setEditForm({ title: caseData.title, caseNumber: caseData.caseNumber ?? '', courtName: caseData.courtName, caseType: caseData.caseType, oppositeParty: caseData.oppositeParty ?? '', status: caseData.status, fixedFee: String(caseData.fixedFee), notes: caseData.notes ?? '' })
    setEditMode(true)
  }

  async function saveEdit() {
    if (!csId || !editForm.title.trim() || !editForm.courtName.trim()) return
    setEditLoading(true)
    try {
      await updateCase(csId, { title: editForm.title.trim(), caseNumber: editForm.caseNumber.trim() || undefined, courtName: editForm.courtName.trim(), caseType: editForm.caseType, oppositeParty: editForm.oppositeParty.trim() || undefined, status: editForm.status, fixedFee: Number(editForm.fixedFee) || 0, notes: editForm.notes.trim() || undefined })
      toast({ title: 'Case updated' })
      setEditMode(false)
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setEditLoading(false) }
  }

  async function changeStatus(newStatus: string) {
    if (!csId) return
    setStatusChanging(true)
    try {
      await updateCase(csId, { status: newStatus })
      toast({ title: `Status changed to ${newStatus}` })
    } catch { toast({ title: 'Error', variant: 'destructive' }) }
    finally { setStatusChanging(false) }
  }

  if (!caseData || !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-500 text-lg font-medium">Case not found</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Back */}
      <button onClick={() => navigate(`/clients/${clientId}`)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors">
        <ArrowLeft className="w-4 h-4" />Back to {client.name}
      </button>

      {/* Case Header */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        {editMode ? (
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-900">Edit Case</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><Label>Case Title *</Label><Input className="mt-1" value={editForm.title} onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><Label>Case Number</Label><Input className="mt-1" value={editForm.caseNumber} onChange={e => setEditForm(f => ({ ...f, caseNumber: e.target.value }))} /></div>
              <div><Label>Court Name *</Label><Input className="mt-1" value={editForm.courtName} onChange={e => setEditForm(f => ({ ...f, courtName: e.target.value }))} /></div>
              <div><Label>Case Type</Label><Input className="mt-1" value={editForm.caseType} onChange={e => setEditForm(f => ({ ...f, caseType: e.target.value }))} /></div>
              <div><Label>Opposite Party</Label><Input className="mt-1" value={editForm.oppositeParty} onChange={e => setEditForm(f => ({ ...f, oppositeParty: e.target.value }))} /></div>
              <div><Label>Fixed Fee (₹)</Label><Input className="mt-1" type="number" value={editForm.fixedFee} onChange={e => setEditForm(f => ({ ...f, fixedFee: e.target.value }))} /></div>
              <div><Label>Status</Label>
                <Select value={editForm.status} onValueChange={v => setEditForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{CASE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2"><Label>Notes</Label><Textarea className="mt-1 min-h-[70px]" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} /></div>
            </div>
            <div className="flex gap-2">
              <Button onClick={saveEdit} disabled={editLoading} className="bg-blue-600 hover:bg-blue-700"><Save className="w-4 h-4 mr-1.5" />{editLoading ? 'Saving...' : 'Save'}</Button>
              <Button variant="outline" onClick={() => setEditMode(false)}><X className="w-4 h-4 mr-1.5" />Cancel</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-xl font-bold text-gray-900">{caseData.title}</h1>
                  {caseData.caseNumber && <span className="text-sm text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">#{caseData.caseNumber}</span>}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                  <span>Client: <Link to={`/clients/${clientId}`} className="text-blue-600 hover:underline font-medium">{client.name}</Link></span>
                  <span>·</span>
                  <span>{caseData.courtName}</span>
                  <span>·</span>
                  <span>{caseData.caseType}</span>
                  {caseData.oppositeParty && <><span>·</span><span>vs {caseData.oppositeParty}</span></>}
                </div>
                {caseData.nextHearingDate && (
                  <p className="text-sm text-blue-600 font-medium mt-1">Next Hearing: {formatDate(caseData.nextHearingDate)}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Status dropdown */}
                <Select value={caseData.status} onValueChange={changeStatus} disabled={statusChanging}>
                  <SelectTrigger className={`h-8 text-xs font-semibold w-auto px-2 border ${getCaseStatusColor(caseData.status)}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>{CASE_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={startEdit}><Edit2 className="w-4 h-4 mr-1.5" />Edit</Button>
              </div>
            </div>

            {/* Financial Summary Bar */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
              {[
                { label: 'Fixed Fee', val: formatCurrency(caseData.fixedFee), cls: 'text-gray-700' },
                { label: 'Variable', val: formatCurrency(variableTotal), cls: 'text-gray-700' },
                { label: 'Total', val: formatCurrency(grandTotal), cls: 'text-gray-900 font-bold' },
                { label: 'Collected', val: formatCurrency(collected), cls: 'text-green-600 font-semibold' },
                { label: 'Pending', val: formatCurrency(pending), cls: pending > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-semibold' },
              ].map(({ label, val, cls }) => (
                <div key={label} className="text-center">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className={`text-base ${cls}`}>{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="timeline">
        <TabsList className="bg-white border border-gray-200 p-1 rounded-xl shadow-sm w-full justify-start overflow-x-auto">
          <TabsTrigger value="timeline" className="rounded-lg text-sm">Timeline</TabsTrigger>
          <TabsTrigger value="hearings" className="rounded-lg text-sm">Hearings</TabsTrigger>
          <TabsTrigger value="documents" className="rounded-lg text-sm">Documents</TabsTrigger>
          <TabsTrigger value="payments" className="rounded-lg text-sm">Payments</TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-lg text-sm">Tasks</TabsTrigger>
          <TabsTrigger value="communication" className="rounded-lg text-sm">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline" className="mt-5">
          <TimelineTab caseId={caseData.id!} clientId={caseData.clientId} />
        </TabsContent>
        <TabsContent value="hearings" className="mt-5">
          <HearingsTab caseId={caseData.id!} clientId={caseData.clientId} />
        </TabsContent>
        <TabsContent value="documents" className="mt-5">
          <DocumentsTab caseId={caseData.id!} clientId={caseData.clientId} />
        </TabsContent>
        <TabsContent value="payments" className="mt-5">
          <PaymentsTab caseId={caseData.id!} clientId={caseData.clientId} fixedFee={caseData.fixedFee} />
        </TabsContent>
        <TabsContent value="tasks" className="mt-5">
          <TasksTab caseId={caseData.id!} clientId={caseData.clientId} />
        </TabsContent>
        <TabsContent value="communication" className="mt-5">
          <CommunicationTab caseId={caseData.id!} clientId={caseData.clientId} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
