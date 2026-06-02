import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  IndianRupee, TrendingUp, TrendingDown, CreditCard, Search,
  Plus, Filter, Printer, ChevronRight, CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { usePendingCollections, useClients, useCases, addPayment } from '@/hooks/useDB'
import { db } from '@/db/database'
import { formatCurrency, formatDate, formatDateTime, getInitials, PAYMENT_MODES } from '@/lib/utils'

type PaymentMode = 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other'

function StatCard({ label, value, icon: Icon, color, bgColor }: { label: string; value: string; icon: React.ElementType; color: string; bgColor: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 md:p-4">
      {/* Mobile: vertical stack — icon + label + value */}
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${bgColor}`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-xs text-gray-500 font-medium truncate">{label}</p>
      <p className="text-sm md:text-base font-bold text-gray-900 leading-tight truncate">{value}</p>
    </div>
  )
}

function AddPaymentModal({ onClose, prefillClientId, prefillCaseId }: { onClose: () => void; prefillClientId?: number; prefillCaseId?: number }) {
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const [form, setForm] = useState({
    clientId: prefillClientId ? String(prefillClientId) : '',
    caseId: prefillCaseId ? String(prefillCaseId) : '',
    amount: '', date: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash' as PaymentMode, remarks: '',
  })
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
      toast({ title: 'Payment recorded', description: `${formatCurrency(Number(form.amount))} recorded successfully.` })
      onClose()
    } catch { toast({ title: 'Error', description: 'Failed to record payment.', variant: 'destructive' }) }
    finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Client *</Label>
          <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v, caseId: '' }))}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select client" /></SelectTrigger>
            <SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Case *</Label>
          <Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))} disabled={!form.clientId}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="Select case" /></SelectTrigger>
            <SelectContent>{clientCases.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>Amount (₹) *</Label>
          <Input className="mt-1" type="number" min="1" placeholder="5000" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} required />
        </div>
        <div>
          <Label>Date *</Label>
          <Input className="mt-1" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
        </div>
        <div>
          <Label>Payment Mode</Label>
          <Select value={form.paymentMode} onValueChange={(v: any) => setForm(f => ({ ...f, paymentMode: v }))}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Remarks</Label>
          <Input className="mt-1" placeholder="Optional remarks" value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading || !form.caseId || !form.amount} className="bg-blue-600 hover:bg-blue-700">
          {loading ? 'Recording...' : 'Record Payment'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export default function Payments() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const pendingCollections = usePendingCollections() ?? []

  const [showAdd, setShowAdd] = useState(false)
  const [prefillClientId, setPrefillClientId] = useState<number | undefined>()
  const [prefillCaseId, setPrefillCaseId] = useState<number | undefined>()
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Enrich payments with client/case names
  const enrichedPayments = useLiveQuery(async () => {
    const allPayments = await db.payments.orderBy('date').reverse().toArray()
    return Promise.all(allPayments.map(async (p) => {
      const [caseData, clientData] = await Promise.all([db.cases.get(p.caseId), db.clients.get(p.clientId)])
      return { ...p, caseName: caseData?.title ?? 'Unknown', clientName: clientData?.name ?? 'Unknown', caseId: p.caseId, clientId: p.clientId }
    }))
  }, [])

  // Summary stats
  const stats = useLiveQuery(async () => {
    const [allCases, allPayments, allVariableCharges] = await Promise.all([
      db.cases.toArray(), db.payments.toArray(), db.variableCharges.toArray(),
    ])
    let totalFees = 0
    for (const c of allCases) {
      totalFees += c.fixedFee
      totalFees += allVariableCharges.filter(v => v.caseId === c.id).reduce((s, v) => s + v.amount, 0)
    }
    const collected = allPayments.reduce((s, p) => s + p.amount, 0)
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const recentCount = allPayments.filter(p => new Date(p.date) >= monthStart).length
    return { totalFees, collected, pending: Math.max(0, totalFees - collected), recentCount }
  }, [])

  // Filtered payments
  const filtered = useMemo(() => {
    if (!enrichedPayments) return []
    return enrichedPayments.filter(p => {
      const q = search.toLowerCase()
      const matchSearch = !q || p.clientName.toLowerCase().includes(q) || p.caseName.toLowerCase().includes(q) || p.paymentMode.toLowerCase().includes(q)
      const matchMode = modeFilter === 'all' || p.paymentMode === modeFilter
      const pDate = new Date(p.date)
      const matchFrom = !dateFrom || pDate >= new Date(dateFrom)
      const matchTo = !dateTo || pDate <= new Date(dateTo + 'T23:59:59')
      return matchSearch && matchMode && matchFrom && matchTo
    })
  }, [enrichedPayments, search, modeFilter, dateFrom, dateTo])

  function handleQuickPayment(clientId?: number, caseId?: number) {
    setPrefillClientId(clientId)
    setPrefillCaseId(caseId)
    setShowAdd(true)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500 mt-0.5 hidden sm:block">Track fees, collections, and outstanding amounts</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint} className="hidden sm:flex min-h-[44px]">
            <Printer className="w-4 h-4 mr-1.5" />Print
          </Button>
          <Button onClick={() => handleQuickPayment()} className="bg-blue-600 hover:bg-blue-700 min-h-[44px]">
            <Plus className="w-4 h-4 md:mr-1.5" />
            <span className="hidden md:inline">Record Payment</span>
          </Button>
        </div>
      </div>

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label="Total Fees" value={stats ? formatCurrency(stats.totalFees) : '...'} icon={IndianRupee} color="text-gray-600" bgColor="bg-gray-100" />
        <StatCard label="Collected" value={stats ? formatCurrency(stats.collected) : '...'} icon={TrendingUp} color="text-green-600" bgColor="bg-green-100" />
        <StatCard label="Pending" value={stats ? formatCurrency(stats.pending) : '...'} icon={TrendingDown} color="text-red-600" bgColor="bg-red-100" />
        <StatCard label="This Month" value={`${stats?.recentCount ?? 0} payments`} icon={CreditCard} color="text-blue-600" bgColor="bg-blue-100" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <div className="overflow-x-auto -mx-4 px-4">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-xl shadow-sm w-max min-w-full">
            <TabsTrigger value="overview" className="rounded-lg whitespace-nowrap">Overview</TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg whitespace-nowrap">All Payments</TabsTrigger>
            <TabsTrigger value="outstanding" className="rounded-lg whitespace-nowrap">Outstanding</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 md:mt-5 space-y-4 md:space-y-5">
          {/* Recent Payments */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Recent Payments</h3>
              <span className="text-xs text-gray-400">{enrichedPayments?.length ?? 0} total</span>
            </div>
            {(!enrichedPayments || enrichedPayments.length === 0) ? (
              <div className="py-12 text-center">
                <CreditCard className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No payments recorded yet</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {enrichedPayments.slice(0, 8).map(p => (
                  <div key={p.id} onClick={() => navigate(`/clients/${p.clientId}/cases/${p.caseId}`)}
                    className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 md:py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 flex-shrink-0">
                      <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{getInitials(p.clientName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm group-hover:text-blue-600 transition-colors">{p.clientName}</p>
                      <p className="text-xs text-gray-400 truncate">{p.caseName}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-semibold text-green-600 text-sm">{formatCurrency(p.amount)}</p>
                      <div className="flex items-center gap-1.5 justify-end mt-0.5">
                        <Badge variant="outline" className="text-xs hidden sm:inline-flex">{p.paymentMode}</Badge>
                        <span className="text-xs text-gray-400">{formatDate(p.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outstanding Summary */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm md:text-base">Outstanding Clients</h3>
              <span className="text-xs text-gray-400">{pendingCollections.length} clients with pending dues</span>
            </div>
            {pendingCollections.length === 0 ? (
              <div className="py-12 text-center">
                <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">All fees collected!</p>
                <p className="text-gray-400 text-sm">No outstanding dues at this time.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {pendingCollections.slice(0, 6).map(({ client, pending, daysOutstanding }) => (
                  <div key={client.id} className="flex items-center gap-3 md:gap-4 px-4 md:px-5 py-4">
                    <Avatar className="w-8 h-8 md:w-9 md:h-9 flex-shrink-0">
                      <AvatarFallback className="bg-red-100 text-red-700 text-xs font-bold">{getInitials(client.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate text-sm">{client.name}</p>
                      <p className="text-xs text-gray-400 hidden sm:block">{daysOutstanding} days outstanding</p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      <span className="text-sm font-bold text-red-600">{formatCurrency(pending)}</span>
                      <Button size="sm" variant="outline" className="text-xs h-9 px-2 min-h-[36px]"
                        onClick={() => handleQuickPayment(client.id)}>
                        <Plus className="w-3 h-3 mr-1" />Pay
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* All Payments Tab */}
        <TabsContent value="all" className="mt-4 md:mt-5 space-y-4">
          {/* Filters — stack on mobile, row on desktop */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
            <div className="flex flex-col md:grid md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input className="pl-9 h-11" placeholder="Search client, case..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={modeFilter} onValueChange={setModeFilter}>
                <SelectTrigger className="h-11"><SelectValue placeholder="Payment mode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  {PAYMENT_MODES.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              <div>
                <Input type="date" placeholder="From date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="text-sm h-11" />
              </div>
              <div>
                <Input type="date" placeholder="To date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="text-sm h-11" />
              </div>
            </div>
          </div>

          {/* Mobile: card list. Desktop: table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Desktop table header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-2">Date</div>
              <div className="col-span-3">Client</div>
              <div className="col-span-3">Case</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2">Mode</div>
            </div>

            {filtered.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No payments found{search ? ` for "${search}"` : ''}</p>
              </div>
            ) : (
              <>
                {/* Mobile card list */}
                <div className="md:hidden divide-y divide-gray-100">
                  {filtered.map(p => (
                    <div key={p.id} onClick={() => navigate(`/clients/${p.clientId}/cases/${p.caseId}`)}
                      className="flex items-center gap-3 px-4 py-4 hover:bg-gray-50 cursor-pointer transition-colors group">
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarFallback className="bg-blue-100 text-blue-700 text-xs font-bold">{getInitials(p.clientName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm group-hover:text-blue-600">{p.clientName}</p>
                        <p className="text-xs text-gray-400 truncate">{p.caseName}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-xs">{p.paymentMode}</Badge>
                          <span className="text-xs text-gray-400">{formatDate(p.date)}</span>
                        </div>
                      </div>
                      <span className="text-sm font-semibold text-green-600 flex-shrink-0">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>

                {/* Desktop table rows */}
                <div className="hidden md:block divide-y divide-gray-50">
                  {filtered.map(p => (
                    <div key={p.id} onClick={() => navigate(`/clients/${p.clientId}/cases/${p.caseId}`)}
                      className="grid grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50 cursor-pointer transition-colors group text-sm">
                      <div className="col-span-2 text-gray-500 text-xs">{formatDate(p.date)}</div>
                      <div className="col-span-3 font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">{p.clientName}</div>
                      <div className="col-span-3 text-gray-500 truncate">{p.caseName}</div>
                      <div className="col-span-2 text-right font-semibold text-green-600">{formatCurrency(p.amount)}</div>
                      <div className="col-span-2">
                        <Badge variant="outline" className="text-xs">{p.paymentMode}</Badge>
                        {p.remarks && <p className="text-xs text-gray-400 truncate mt-0.5 italic">{p.remarks}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {filtered.length > 0 && (
              <div className="px-4 md:px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm">
                <span className="text-gray-500">{filtered.length} payment{filtered.length !== 1 ? 's' : ''}</span>
                <span className="font-bold text-gray-900">Total: {formatCurrency(filtered.reduce((s, p) => s + p.amount, 0))}</span>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Outstanding Tab */}
        <TabsContent value="outstanding" className="mt-4 md:mt-5">
          {pendingCollections.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm py-16 md:py-20 text-center">
              <CheckCircle2 className="w-14 h-14 md:w-16 md:h-16 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600 font-semibold text-lg">All fees collected!</p>
              <p className="text-gray-400">No outstanding dues at this time.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Desktop table header */}
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Client</div>
                <div className="col-span-3 text-right">Pending Amount</div>
                <div className="col-span-3 text-center">Days Outstanding</div>
                <div className="col-span-2 text-right">Action</div>
              </div>
              <div className="divide-y divide-gray-50">
                {pendingCollections.map(({ client, pending, daysOutstanding }) => (
                  <div key={client.id}>
                    {/* Mobile card */}
                    <div className="md:hidden flex items-center gap-3 px-4 py-4">
                      <Avatar className="w-9 h-9 flex-shrink-0">
                        <AvatarFallback className="bg-red-100 text-red-700 text-sm font-bold">{getInitials(client.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 truncate text-sm">{client.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-base font-bold text-red-600">{formatCurrency(pending)}</span>
                          <Badge className={`text-xs ${daysOutstanding > 30 ? 'bg-red-100 text-red-700 border-red-200' : daysOutstanding > 15 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                            {daysOutstanding}d
                          </Badge>
                        </div>
                      </div>
                      <Button size="sm" onClick={() => handleQuickPayment(client.id)} className="bg-green-600 hover:bg-green-700 text-xs min-h-[44px]">
                        <Plus className="w-3.5 h-3.5 mr-1" />Pay
                      </Button>
                    </div>
                    {/* Desktop row */}
                    <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
                      <div className="col-span-4 flex items-center gap-3">
                        <Avatar className="w-9 h-9 flex-shrink-0">
                          <AvatarFallback className="bg-red-100 text-red-700 text-sm font-bold">{getInitials(client.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                          {client.mobile && <p className="text-xs text-gray-400">{client.mobile}</p>}
                        </div>
                      </div>
                      <div className="col-span-3 text-right">
                        <span className="text-lg font-bold text-red-600">{formatCurrency(pending)}</span>
                      </div>
                      <div className="col-span-3 text-center">
                        <Badge className={`text-xs ${daysOutstanding > 30 ? 'bg-red-100 text-red-700 border-red-200' : daysOutstanding > 15 ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                          {daysOutstanding} days
                        </Badge>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <Button size="sm" onClick={() => handleQuickPayment(client.id)} className="bg-green-600 hover:bg-green-700 text-xs">
                          <Plus className="w-3.5 h-3.5 mr-1" />Payment
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 md:px-5 py-3 bg-red-50 border-t border-red-100 flex justify-between items-center">
                <span className="text-sm text-gray-600 font-medium">{pendingCollections.length} clients with pending dues</span>
                <span className="text-sm md:text-base font-bold text-red-700">{formatCurrency(pendingCollections.reduce((s, c) => s + c.pending, 0))} total</span>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Payment Modal */}
      <Dialog open={showAdd} onOpenChange={open => !open && setShowAdd(false)}>
        <DialogContent className="max-w-[100vw] w-full sm:max-w-lg h-full sm:h-auto rounded-none sm:rounded-xl overflow-y-auto sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a fee payment from a client.</DialogDescription>
          </DialogHeader>
          <AddPaymentModal onClose={() => setShowAdd(false)} prefillClientId={prefillClientId} prefillCaseId={prefillCaseId} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
