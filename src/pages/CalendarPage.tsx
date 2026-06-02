import { useState, useRef, useEffect, useCallback } from 'react'
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
import { cn, formatTime, getHearingStatusColor, HEARING_STATUSES } from '@/lib/utils'
import { format, addDays, subDays, startOfMonth, endOfMonth, eachDayOfInterval, isToday, isSameDay, addMonths, subMonths } from 'date-fns'
import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, Scale } from 'lucide-react'

// ── Mobile Calendar Component ────────────────────────────────────────────

interface MobileHearing {
  id: number
  caseId: number
  clientId: number
  time: string
  status: string
  clientName: string
  caseName: string
  courtNumber?: string
  judgeName?: string
  date: Date
}

function MobileCalendar({ onAddHearing }: { onAddHearing: (date: string) => void }) {
  const navigate = useNavigate()
  const [viewMonth, setViewMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const stripRef = useRef<HTMLDivElement>(null)

  // Load all hearings for the mobile view
  const allHearings = useLiveQuery(async (): Promise<MobileHearing[]> => {
    const hearings = await db.hearings.toArray()
    return Promise.all(hearings.map(async (h) => {
      const [caseData, clientData] = await Promise.all([
        db.cases.get(h.caseId),
        db.clients.get(h.clientId),
      ])
      return {
        id: h.id!,
        caseId: h.caseId,
        clientId: h.clientId,
        time: h.time,
        status: h.status,
        clientName: clientData?.name ?? 'Unknown',
        caseName: caseData?.title ?? 'Unknown',
        courtNumber: h.courtNumber,
        judgeName: h.judgeName,
        date: new Date(h.date),
      }
    }))
  }, []) ?? []

  // Days in current view month
  const monthDays = eachDayOfInterval({
    start: startOfMonth(viewMonth),
    end: endOfMonth(viewMonth),
  })

  // Hearings for selected date
  const dayHearings = allHearings
    .filter(h => isSameDay(h.date, selectedDate))
    .sort((a, b) => a.time.localeCompare(b.time))

  // Dates with hearings (for dot indicator)
  const datesWithHearings = new Set(
    allHearings.map(h => format(h.date, 'yyyy-MM-dd'))
  )

  // Scroll selected date into view in the strip
  useEffect(() => {
    if (!stripRef.current) return
    const btn = stripRef.current.querySelector('[data-selected="true"]') as HTMLElement
    if (btn) btn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [selectedDate])

  function statusColor(status: string) {
    switch (status) {
      case 'Completed': return 'bg-emerald-500'
      case 'Adjourned': return 'bg-amber-500'
      case 'Cancelled': return 'bg-gray-400'
      default: return 'bg-blue-500'
    }
  }

  return (
    <div className="space-y-3">
      {/* Month navigator */}
      <div className="flex items-center justify-between px-1">
        <button
          onClick={() => setViewMonth(m => subMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h2 className="text-base font-semibold text-gray-900">
          {format(viewMonth, 'MMMM yyyy')}
        </h2>
        <button
          onClick={() => setViewMonth(m => addMonths(m, 1))}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={i} className="text-xs font-medium text-gray-400 py-1">{d}</div>
        ))}
      </div>

      {/* Full month grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {/* Empty cells for first week offset */}
        {Array.from({ length: startOfMonth(viewMonth).getDay() }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
        {monthDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const hasHearing = datesWithHearings.has(dateStr)
          const isSelected = isSameDay(day, selectedDate)
          const todayDay = isToday(day)
          return (
            <button
              key={dateStr}
              onClick={() => { setSelectedDate(day); setViewMonth(day) }}
              className={cn(
                'mx-auto flex flex-col items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-colors',
                isSelected && 'bg-blue-600 text-white',
                !isSelected && todayDay && 'text-blue-600 font-bold',
                !isSelected && !todayDay && 'text-gray-700 hover:bg-gray-100',
              )}
            >
              <span>{format(day, 'd')}</span>
              {hasHearing && (
                <span className={cn(
                  'w-1 h-1 rounded-full mt-0.5',
                  isSelected ? 'bg-white' : 'bg-blue-500'
                )} />
              )}
            </button>
          )
        })}
      </div>

      {/* Selected day hearings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE')},&nbsp;
              {format(selectedDate, 'dd MMM yyyy')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {dayHearings.length === 0 ? 'No hearings' : `${dayHearings.length} hearing${dayHearings.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <button
            onClick={() => onAddHearing(format(selectedDate, 'yyyy-MM-dd'))}
            className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {dayHearings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <Scale className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm font-medium text-gray-500">No hearings scheduled</p>
            <p className="text-xs text-gray-400 mt-1">Tap + to add a hearing for this day</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {dayHearings.map(h => (
              <button
                key={h.id}
                onClick={() => navigate(`/clients/${h.clientId}/cases/${h.caseId}`)}
                className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
              >
                {/* Time + status dot */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                  <span className={cn('w-2.5 h-2.5 rounded-full flex-shrink-0', statusColor(h.status))} />
                  <span className="text-xs font-mono text-gray-500">{formatTime(h.time)}</span>
                </div>
                {/* Details */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{h.clientName}</p>
                  <p className="text-xs text-gray-500 truncate">{h.caseName}</p>
                  {h.courtNumber && (
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      Court {h.courtNumber}
                      {h.judgeName ? ` · ${h.judgeName}` : ''}
                    </p>
                  )}
                </div>
                {/* Status badge */}
                <Badge className={cn('text-white text-xs flex-shrink-0 border-0', statusColor(h.status))}>
                  {h.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming hearings (next 7 days) */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
          <p className="text-sm font-semibold text-gray-700">Upcoming (next 7 days)</p>
        </div>
        {(() => {
          const today = new Date()
          const upcoming = allHearings
            .filter(h => {
              const d = new Date(h.date)
              return d > today && d <= addDays(today, 7) && h.status === 'Scheduled'
            })
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.time.localeCompare(b.time))
            .slice(0, 5)
          if (upcoming.length === 0) return (
            <p className="text-xs text-gray-400 px-4 py-4 text-center">No upcoming hearings in next 7 days</p>
          )
          return (
            <div className="divide-y divide-gray-50">
              {upcoming.map(h => (
                <button
                  key={h.id}
                  onClick={() => { setSelectedDate(new Date(h.date)); setViewMonth(new Date(h.date)); navigate(`/clients/${h.clientId}/cases/${h.caseId}`) }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-blue-700 leading-none">{format(new Date(h.date), 'dd')}</span>
                    <span className="text-xs text-blue-500 leading-none">{format(new Date(h.date), 'MMM')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{h.clientName}</p>
                    <p className="text-xs text-gray-500 truncate">{h.caseName} · {formatTime(h.time)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </button>
              ))}
            </div>
          )
        })()}
      </div>
    </div>
  )
}

// ── Main Calendar Page ────────────────────────────────────────────────────

export default function CalendarPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const clients = useClients() ?? []
  const cases = useCases() ?? []
  const calendarRef = useRef<FullCalendar>(null)

  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const fn = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])

  const [addModal, setAddModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [form, setForm] = useState({
    clientId: '', caseId: '', date: '', time: '10:00',
    courtNumber: '', judgeName: '', remarks: '', status: 'Scheduled' as const,
  })
  const [loading, setLoading] = useState(false)

  function openAddHearing(date: string) {
    setSelectedDate(date)
    setForm(f => ({ ...f, date, clientId: '', caseId: '' }))
    setAddModal(true)
  }

  // Desktop: FullCalendar events
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
      const endDt = new Date(startDt.getTime() + 60 * 60 * 1000)
      let backgroundColor = '#3b82f6'
      let borderColor = '#2563eb'
      if (h.status === 'Completed') { backgroundColor = '#10b981'; borderColor = '#059669' }
      if (h.status === 'Adjourned') { backgroundColor = '#f59e0b'; borderColor = '#d97706' }
      if (h.status === 'Cancelled') { backgroundColor = '#6b7280'; borderColor = '#4b5563' }
      return {
        id: String(h.id),
        title: `${clientData?.name ?? ''} – ${caseData?.title ?? ''}`,
        start: startDt.toISOString(),
        end: endDt.toISOString(),
        backgroundColor, borderColor, textColor: '#ffffff',
        extendedProps: {
          clientId: h.clientId, caseId: h.caseId, status: h.status,
          time: h.time, clientName: clientData?.name, caseName: caseData?.title,
          courtNumber: h.courtNumber, judgeName: h.judgeName,
        },
      }
    }))
  }, [])

  function handleEventClick(arg: EventClickArg) {
    const { clientId, caseId } = arg.event.extendedProps
    if (clientId && caseId) navigate(`/clients/${clientId}/cases/${caseId}`)
  }

  function handleDateClick(arg: DateClickArg) {
    openAddHearing(arg.dateStr)
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
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-xs md:text-sm text-gray-500 mt-0.5">Schedule & track hearings</p>
        </div>
        <div className="flex items-center gap-2 md:gap-3">
          {/* Legend — desktop only */}
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
            onClick={() => openAddHearing(format(new Date(), 'yyyy-MM-dd'))}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 min-h-[44px] hidden md:flex"
          >
            + Add Hearing
          </Button>
        </div>
      </div>

      {/* Mobile view — custom calendar */}
      <div className="md:hidden">
        <MobileCalendar onAddHearing={openAddHearing} />
      </div>

      {/* Desktop view — FullCalendar */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
          }}
          buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day', list: 'List' }}
          events={events ?? []}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          eventContent={renderEventContent}
          height="auto"
          aspectRatio={1.8}
          dayMaxEvents={3}
          nowIndicator
          editable={false}
          selectable={true}
          weekends={true}
          slotMinTime="06:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          eventTimeFormat={{ hour: 'numeric', minute: '2-digit', meridiem: 'short' }}
        />
      </div>

      {/* Add Hearing Modal */}
      <Dialog open={addModal} onOpenChange={open => !open && setAddModal(false)}>
        <DialogContent className="max-w-[100vw] w-full sm:max-w-lg h-full sm:h-auto rounded-none sm:rounded-xl overflow-y-auto sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Schedule Hearing</DialogTitle>
            <DialogDescription>
              {selectedDate ? `${format(new Date(selectedDate), 'EEEE, dd MMMM yyyy')}` : 'Add a new court hearing'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitHearing} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <Label>Client *</Label>
                <Select value={form.clientId} onValueChange={v => setForm(f => ({ ...f, clientId: v, caseId: '' }))}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select client" /></SelectTrigger>
                  <SelectContent>{clients.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <Label>Case *</Label>
                <Select value={form.caseId} onValueChange={v => setForm(f => ({ ...f, caseId: v }))} disabled={!form.clientId}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue placeholder="Select case" /></SelectTrigger>
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
                <Label>Court No.</Label>
                <Input className="mt-1 h-11" placeholder="Court 5" value={form.courtNumber} onChange={e => setForm(f => ({ ...f, courtNumber: e.target.value }))} />
              </div>
              <div>
                <Label>Judge</Label>
                <Input className="mt-1 h-11" placeholder="Hon. Justice..." value={form.judgeName} onChange={e => setForm(f => ({ ...f, judgeName: e.target.value }))} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v: any) => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="mt-1 h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>{HEARING_STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Remarks</Label>
                <Input className="mt-1 h-11" placeholder="Optional..." value={form.remarks} onChange={e => setForm(f => ({ ...f, remarks: e.target.value }))} />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setAddModal(false)} className="min-h-[44px] flex-1 sm:flex-none">Cancel</Button>
              <Button type="submit" disabled={loading || !form.caseId || !form.date} className="bg-blue-600 hover:bg-blue-700 min-h-[44px] flex-1 sm:flex-none">
                {loading ? 'Scheduling...' : 'Schedule Hearing'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
