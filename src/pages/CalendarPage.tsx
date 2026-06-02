import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import type { EventClickArg, EventContentArg } from '@fullcalendar/core'
import type { DateClickArg } from '@fullcalendar/interaction'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { useClients, useCases, addHearing } from '@/hooks/useDB'
import { db } from '@/db/database'
import { formatTime, getHearingStatusColor, HEARING_STATUSES } from '@/lib/utils'
import { format } from 'date-fns'

export default function CalendarPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const calendarRef = useRef<FullCalendar>(null)

  // Detect mobile for initial view
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [addModal, setAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [form, setForm] = useState({
    clientId: '', caseId: '', date: '', time: '10:00',
    courtNumber: '', judgeName: '', remarks: '', status: 'Scheduled' as const,
  })
  const [loading, setLoading] = useState(false)

  // Build FullCalendar events
  const events = useLiveQuery(async () => {
    const allHearings = await db.hearings.toArray()
    return Promise.all(allHearings.map(async (h) => {
      const [caseData, clientData] = await Promise.all([
        db.cases.get(h.caseId),
        db.clients.get(h.clientId),
      ])
      const [hh, mm] = h.time.split(':').map(Number)
      const startDt = new Date(h.date)
      startDt.setHours(hh, mm, 0, 0)
      const endDt = new Date(startDt.getTime() + 60 * 60 * 1000) // 1hr duration

      let backgroundColor = '#3b82f6' // blue - scheduled
      let borderColor = '#2563eb'
      if (h.status === 'Completed') { backgroundColor = '#10b981'; borderColor = '#059669' }
      if (h.status === 'Adjourned') { backgroundColor = '#f59e0b'; borderColor = '#d97706' }
      if (h.status === 'Cancelled') { backgroundColor = '#6b7280'; borderColor = '#4b5563' }

      return {
        id: String(h.id),
        title: `${clientData?.name ?? 'Unknown'} – ${caseData?.title ?? 'Unknown'}`,
        start: startDt.toISOString(),
        end: endDt.toISOString(),
        backgroundColor,
        borderColor,
        textColor: '#ffffff',
        extendedProps: {
          clientId: h.clientId,
          caseId: h.caseId,
          status: h.status,
          time: h.time,
          clientName: clientData?.name,
          caseName: caseData?.title,
          courtNumber: h.courtNumber,
          judgeName: h.judgeName,
        },
      }
    }))
  }, [])

  function handleEventClick(arg: EventClickArg) {
    const { clientId, caseId } = arg.event.extendedProps
    if (clientId && caseId) navigate(`/clients/${clientId}/cases/${caseId}`)
  }

  function handleDateClick(arg: DateClickArg) {
    setSelectedDate(arg.dateStr)
    setForm(f => ({ ...f, date: arg.dateStr, clientId: '', caseId: '' }))
    setAddModal(true)
  }

  const clientCases = cases.filter(c => String(c.clientId) === form.clientId)

  async function submitHearing(e: React.FormEvent) {
    e.preventDefault()
    if (!form.caseId || !form.date) return
    const sc = cases.find(c => String(c.id) === form.caseId)
    if (!sc) return
    setLoading(true)
    try {
      await addHearing({
        caseId: Number(form.caseId), clientId: sc.clientId,
        date: new Date(form.date), time: form.time,
        courtNumber: form.courtNumber.trim() || undefined,
        judgeName: form.judgeName.trim() || undefined,
        remarks: form.remarks.trim() || undefined,
        status: form.status,
      })
      toast({ title: 'Hearing scheduled', description: `${format(new Date(form.date), 'dd MMM yyyy')} at ${formatTime(form.time)}` })
      setAddModal(false)
      setForm({ clientId: '', caseId: '', date: '', time: '10:00', courtNumber: '', judgeName: '', remarks: '', status: 'Scheduled' })
    } catch {
      toast({ title: 'Error', description: 'Failed to schedule hearing.', variant: 'destructive' })
    } finally { setLoading(false) }
  }

  function renderEventContent(arg: EventContentArg) {
    return (
      <div className="px-1 py-0.5 truncate">
        <p className="text-xs font-semibold truncate leading-tight">{arg.event.extendedProps.clientName}</p>
        <p className="text-xs opacity-90 truncate">{formatTime(arg.event.extendedProps.time)} · {arg.event.extendedProps.caseName}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3 md:space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-sm text-gray-500 mt-0.5">All hearings in one view</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Legend — hidden on mobile */}
          <div className="hidden md:flex items-center gap-3 text-xs">
            {[
              { label: 'Scheduled', color: 'bg-blue-500' },
              { label: 'Completed', color: 'bg-emerald-500' },
              { label: 'Adjourned', color: 'bg-amber-500' },
              { label: 'Cancelled', color: 'bg-gray-500' },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-gray-600">{label}</span>
              </div>
            ))}
          </div>
          <Button
            onClick={() => { setForm(f => ({ ...f, date: format(new Date(), 'yyyy-MM-dd') })); setAddModal(true) }}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 min-h-[44px]"
          >
            <span className="hidden sm:inline">+ Add Hearing</span>
            <span className="sm:hidden">+</span>
          </Button>
        </div>
      </div>

      {/* Mobile legend — compact pills */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'Scheduled', color: 'bg-blue-500' },
          { label: 'Completed', color: 'bg-emerald-500' },
          { label: 'Adjourned', color: 'bg-amber-500' },
          { label: 'Cancelled', color: 'bg-gray-500' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1 flex-shrink-0 bg-gray-50 px-2 py-1 rounded-full border border-gray-200">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-gray-600 text-xs">{label}</span>
          </div>
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2 md:p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: isMobile ? 'listWeek,dayGridMonth' : 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day', list: 'List' }}
          events={events ?? []}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventContent={renderEventContent}
          height="auto"
          aspectRatio={isMobile ? 1.2 : 1.8}
          dayMaxEvents={isMobile ? 2 : 3}
          nowIndicator
          editable={false}
          selectable={true}
          selectMirror={true}
          weekends={true}
          businessHours={{ daysOfWeek: [1, 2, 3, 4, 5, 6], startTime: '09:00', endTime: '18:00' }}
          slotMinTime="06:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
          views={{
            timeGridWeek: { titleFormat: { month: 'short', day: 'numeric', year: 'numeric' } },
          }}
        />
      </div>

      {/* Add Hearing Modal — full screen on mobile */}
      <Dialog open={addModal} onOpenChange={open => !open && setAddModal(false)}>
        <DialogContent className="max-w-[100vw] w-full sm:max-w-lg h-full sm:h-auto rounded-none sm:rounded-xl overflow-y-auto sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Schedule Hearing</DialogTitle>
            <DialogDescription>
              {selectedDate ? `Adding hearing for ${format(new Date(selectedDate), 'EEEE, dd MMMM yyyy')}` : 'Add a new court hearing'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitHearing} className="space-y-4 mt-2">
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
                <Label>Date *</Label>
                <Input className="mt-1 h-11" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div>
                <Label>Time *</Label>
                <Input className="mt-1 h-11" type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} required />
              </div>
              <div>
                <Label>Court Number</Label>
                <Input className="mt-1 h-11" placeholder="Court No. 5" value={form.courtNumber} onChange={e => setForm(f => ({ ...f, courtNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Judge Name</Label>
                <Input className="mt-1 h-11" placeholder="Hon. Justice..." value={form.judgeName} onChange={e => setForm(f => ({ ...f, judgeName: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>{HEARING_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label>Remarks</Label>
                <Input className="mt-1 h-11" placeholder="Any remarks..." value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddModal(false)} className="min-h-[44px]">Cancel</Button>
              <Button type="submit" disabled={loading || !form.caseId || !form.date} className="bg-blue-600 hover:bg-blue-700 min-h-[44px]">
                {loading ? 'Scheduling...' : 'Schedule Hearing'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
