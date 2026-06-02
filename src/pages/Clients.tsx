import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { Search, UserPlus, Users, ChevronRight, Phone, Mail, Briefcase, IndianRupee } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { useClients, addClient } from '@/hooks/useDB'
import { db } from '@/db/database'
import { formatCurrency, getInitials } from '@/lib/utils'

function AddClientModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', mobile: '', email: '', address: '', notes: '' })
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.mobile.trim()) return
    setLoading(true)
    try {
      await addClient({ name: form.name.trim(), mobile: form.mobile.trim(), email: form.email.trim() || undefined, address: form.address.trim() || undefined, notes: form.notes.trim() || undefined })
      toast({ title: 'Client added', description: `${form.name} has been added successfully.` })
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
        <div className="col-span-2"><Label>Address</Label><Input className="mt-1" placeholder="Street, City, State" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} /></div>
        <div className="col-span-2"><Label>Notes</Label><Textarea className="mt-1 min-h-[70px]" placeholder="Any additional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={loading}>{loading ? 'Adding...' : 'Add Client'}</Button>
      </DialogFooter>
    </form>
  )
}

export default function Clients() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)

  const clients = useClients() ?? []

  // Compute stats per client
  const clientStats = useLiveQuery(async () => {
    const [cases, payments, variableCharges] = await Promise.all([
      db.cases.toArray(),
      db.payments.toArray(),
      db.variableCharges.toArray(),
    ])
    const map: Record<number, { activeCases: number; pendingFees: number }> = {}
    for (const c of cases) {
      if (c.clientId == null) continue
      if (!map[c.clientId]) map[c.clientId] = { activeCases: 0, pendingFees: 0 }
      if (c.status !== 'Closed') map[c.clientId].activeCases++
      let totalFee = c.fixedFee
      totalFee += variableCharges.filter(v => v.caseId === c.id).reduce((s, v) => s + v.amount, 0)
      const collected = payments.filter(p => p.caseId === c.id).reduce((s, p) => s + p.amount, 0)
      map[c.clientId].pendingFees += Math.max(0, totalFee - collected)
    }
    return map
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return clients
    return clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    )
  }, [clients, search])

  return (
    <div className="space-y-4 md:space-y-6 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients.length} client{clients.length !== 1 ? 's' : ''} total</p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="bg-blue-600 hover:bg-blue-700 min-h-[44px]">
          <UserPlus className="w-4 h-4 md:mr-2" />
          <span className="hidden md:inline">Add Client</span>
        </Button>
      </div>

      {/* Search — full width on mobile */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          className="pl-9 bg-white border-gray-200 h-11"
          placeholder="Search by name, mobile or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Client List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 md:py-20 text-center bg-white rounded-xl border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          {search ? (
            <>
              <p className="text-gray-600 font-semibold text-lg">No clients found</p>
              <p className="text-gray-400 text-sm mt-1">No results for "{search}"</p>
              <Button variant="outline" className="mt-4" onClick={() => setSearch('')}>Clear search</Button>
            </>
          ) : (
            <>
              <p className="text-gray-600 font-semibold text-lg">No clients yet</p>
              <p className="text-gray-400 text-sm mt-1">Add your first client to get started</p>
              <Button className="mt-4 bg-blue-600 hover:bg-blue-700" onClick={() => setShowAdd(true)}>
                <UserPlus className="w-4 h-4 mr-2" />Add Client
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Mobile card list — show on small screens */}
          <div className="md:hidden divide-y divide-gray-100">
            {filtered.map(client => {
              const stats = clientStats?.[client.id!] ?? { activeCases: 0, pendingFees: 0 }
              return (
                <div
                  key={client.id}
                  onClick={() => navigate(`/clients/${client.id}`)}
                  className="flex items-center gap-3 p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{client.name}</p>
                    <p className="text-sm text-gray-500">{client.mobile}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {stats.pendingFees > 0 ? (
                      <p className="text-sm font-medium text-red-600">{formatCurrency(stats.pendingFees)}</p>
                    ) : (
                      <p className="text-sm font-medium text-green-600">Clear</p>
                    )}
                    <p className="text-xs text-gray-400">{stats.activeCases} case{stats.activeCases !== 1 ? 's' : ''}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </div>
              )
            })}
          </div>

          {/* Desktop table — hidden on mobile */}
          <div className="hidden md:block">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div className="col-span-4">Client</div>
              <div className="col-span-2">Mobile</div>
              <div className="col-span-2 hidden md:block">Email</div>
              <div className="col-span-2 text-center">Active Cases</div>
              <div className="col-span-2 text-right">Pending Fees</div>
            </div>
            <div className="divide-y divide-gray-50">
              {filtered.map(client => {
                const stats = clientStats?.[client.id!] ?? { activeCases: 0, pendingFees: 0 }
                return (
                  <div
                    key={client.id}
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors group items-center"
                  >
                    {/* Client Info */}
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <Avatar className="w-10 h-10 flex-shrink-0">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold">
                          {getInitials(client.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">{client.name}</p>
                        {client.address && <p className="text-xs text-gray-400 truncate">{client.address}</p>}
                      </div>
                    </div>
                    {/* Mobile */}
                    <div className="col-span-2 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{client.mobile}</span>
                      </div>
                    </div>
                    {/* Email */}
                    <div className="col-span-2 hidden md:block min-w-0">
                      {client.email ? (
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                          <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <span className="truncate">{client.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 text-sm">—</span>
                      )}
                    </div>
                    {/* Active Cases */}
                    <div className="col-span-2 flex justify-center">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <Badge variant="outline" className={`text-xs font-semibold ${stats.activeCases > 0 ? 'text-blue-700 border-blue-200 bg-blue-50' : 'text-gray-500'}`}>
                          {stats.activeCases}
                        </Badge>
                      </div>
                    </div>
                    {/* Pending Fees */}
                    <div className="col-span-2 text-right">
                      {stats.pendingFees > 0 ? (
                        <span className="text-sm font-semibold text-red-600">{formatCurrency(stats.pendingFees)}</span>
                      ) : (
                        <span className="text-sm text-green-600 font-medium">Clear</span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-300 ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Results summary */}
      {search && filtered.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          Showing {filtered.length} of {clients.length} clients for "{search}"
        </p>
      )}

      {/* Add Client Modal */}
      <Dialog open={showAdd} onOpenChange={open => !open && setShowAdd(false)}>
        <DialogContent className="max-w-[100vw] w-full sm:max-w-lg h-full sm:h-auto rounded-none sm:rounded-xl overflow-y-auto sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Enter the client's details to create a new profile.</DialogDescription>
          </DialogHeader>
          <AddClientModal onClose={() => setShowAdd(false)} />
        </DialogContent>
      </Dialog>
    </div>
  )
}
