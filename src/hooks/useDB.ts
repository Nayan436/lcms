import { useLiveQuery } from 'dexie-react-hooks'
import { db, type Client, type Case, type Hearing, type Payment, type Task, type TimelineEntry, type Note, type Document, type Communication, type VariableCharge } from '../db/database'
import { isToday, startOfDay, endOfDay, isFuture } from 'date-fns'

// ── CLIENTS ────────────────────────────────────────────────────────────────
export function useClients() {
  return useLiveQuery(() => db.clients.orderBy('name').toArray(), [])
}

export function useClient(id: number | undefined) {
  return useLiveQuery(() => (id ? db.clients.get(id) : undefined), [id])
}

export async function addClient(data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date()
  return db.clients.add({ ...data, createdAt: now, updatedAt: now })
}

export async function updateClient(id: number, data: Partial<Client>) {
  return db.clients.update(id, { ...data, updatedAt: new Date() })
}

export async function deleteClient(id: number) {
  // Cascade delete
  const cases = await db.cases.where('clientId').equals(id).toArray()
  for (const c of cases) {
    if (c.id) await deleteCase(c.id)
  }
  await db.communications.where('clientId').equals(id).delete()
  return db.clients.delete(id)
}

// ── CASES ──────────────────────────────────────────────────────────────────
export function useCases() {
  // updatedAt is not indexed — sort in JS after fetching
  return useLiveQuery(async () => {
    const all = await db.cases.toArray()
    return all.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [])
}

export function useClientCases(clientId: number | undefined) {
  return useLiveQuery(
    () => (clientId ? db.cases.where('clientId').equals(clientId).toArray() : []),
    [clientId],
  )
}

export function useCase(id: number | undefined) {
  return useLiveQuery(() => (id ? db.cases.get(id) : undefined), [id])
}

export async function addCase(data: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date()
  const caseId = await db.cases.add({ ...data, createdAt: now, updatedAt: now })
  await db.timeline.add({ caseId: caseId as number, clientId: data.clientId, type: 'note', title: 'Case Created', description: data.title, date: now, createdAt: now })
  return caseId
}

export async function updateCase(id: number, data: Partial<Case>) {
  return db.cases.update(id, { ...data, updatedAt: new Date() })
}

export async function deleteCase(id: number) {
  await db.hearings.where('caseId').equals(id).delete()
  await db.notes.where('caseId').equals(id).delete()
  await db.timeline.where('caseId').equals(id).delete()
  await db.payments.where('caseId').equals(id).delete()
  await db.variableCharges.where('caseId').equals(id).delete()
  await db.documents.where('caseId').equals(id).delete()
  await db.tasks.where('caseId').equals(id).delete()
  await db.reminders.where('caseId').equals(id).delete()
  return db.cases.delete(id)
}

// ── HEARINGS ──────────────────────────────────────────────────────────────
export function useHearings() {
  return useLiveQuery(() => db.hearings.orderBy('date').toArray(), [])
}

export function useTodayHearings() {
  return useLiveQuery(async () => {
    const today = new Date()
    const hearings = await db.hearings
      .where('date')
      .between(startOfDay(today), endOfDay(today), true, true)
      .toArray()
    return hearings.sort((a, b) => a.time.localeCompare(b.time))
  }, [])
}

export function useCaseHearings(caseId: number | undefined) {
  return useLiveQuery(
    () => (caseId ? db.hearings.where('caseId').equals(caseId).sortBy('date') : []),
    [caseId],
  )
}

export function useUpcomingHearings(days = 30) {
  return useLiveQuery(async () => {
    const now = new Date()
    const future = new Date(now.getTime() + days * 86400000)
    const hearings = await db.hearings
      .where('date')
      .between(startOfDay(now), endOfDay(future), true, true)
      .toArray()
    return hearings.sort((a, b) => {
      const dateDiff = new Date(a.date).getTime() - new Date(b.date).getTime()
      if (dateDiff !== 0) return dateDiff
      return a.time.localeCompare(b.time)
    })
  }, [])
}

export async function addHearing(data: Omit<Hearing, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date()
  const hearingId = await db.hearings.add({ ...data, createdAt: now, updatedAt: now })
  await db.timeline.add({
    caseId: data.caseId, clientId: data.clientId, type: 'hearing',
    title: 'Hearing Added', description: `${data.date instanceof Date ? data.date.toDateString() : data.date} at ${data.time}`,
    date: now, createdAt: now,
  })
  await db.cases.update(data.caseId, { nextHearingDate: data.date, updatedAt: now })
  // Schedule reminders
  await scheduleReminders(hearingId as number, data.caseId, data.clientId, data.date, data.time)
  return hearingId
}

export async function updateHearing(id: number, data: Partial<Hearing>) {
  return db.hearings.update(id, { ...data, updatedAt: new Date() })
}

async function scheduleReminders(hearingId: number, caseId: number, clientId: number, date: Date, time: string) {
  const [h, m] = time.split(':').map(Number)
  const hearingDateTime = new Date(date)
  hearingDateTime.setHours(h, m, 0, 0)

  const reminders = []
  const dayBefore = new Date(hearingDateTime)
  dayBefore.setDate(dayBefore.getDate() - 1)
  dayBefore.setHours(9, 0, 0, 0)
  if (isFuture(dayBefore)) {
    reminders.push({ hearingId, caseId, clientId, title: 'Hearing Tomorrow', reminderTime: dayBefore, status: 'Upcoming' as const, notified: false, createdAt: new Date() })
  }

  const sameDay = new Date(hearingDateTime)
  sameDay.setHours(8, 0, 0, 0)
  if (isFuture(sameDay)) {
    reminders.push({ hearingId, caseId, clientId, title: 'Hearing Today at ' + time, reminderTime: sameDay, status: 'Upcoming' as const, notified: false, createdAt: new Date() })
  }

  const oneHourBefore = new Date(hearingDateTime.getTime() - 60 * 60 * 1000)
  if (isFuture(oneHourBefore)) {
    reminders.push({ hearingId, caseId, clientId, title: 'Hearing in 1 Hour', reminderTime: oneHourBefore, status: 'Upcoming' as const, notified: false, createdAt: new Date() })
  }

  if (reminders.length > 0) await db.reminders.bulkAdd(reminders)
}

// ── PAYMENTS ──────────────────────────────────────────────────────────────
export function usePayments() {
  return useLiveQuery(() => db.payments.orderBy('date').reverse().toArray(), [])
}

export function useCasePayments(caseId: number | undefined) {
  return useLiveQuery(
    () => (caseId ? db.payments.where('caseId').equals(caseId).sortBy('date') : []),
    [caseId],
  )
}

export function useClientPayments(clientId: number | undefined) {
  return useLiveQuery(
    () => (clientId ? db.payments.where('clientId').equals(clientId).sortBy('date') : []),
    [clientId],
  )
}

export async function addPayment(data: Omit<Payment, 'id' | 'createdAt'>) {
  const now = new Date()
  const paymentId = await db.payments.add({ ...data, createdAt: now })
  await db.timeline.add({
    caseId: data.caseId, clientId: data.clientId, type: 'payment',
    title: 'Payment Received', description: `₹${data.amount.toLocaleString('en-IN')} via ${data.paymentMode}`,
    date: now, referenceId: paymentId as number, createdAt: now,
  })
  return paymentId
}

// ── VARIABLE CHARGES ──────────────────────────────────────────────────────
export function useCaseVariableCharges(caseId: number | undefined) {
  return useLiveQuery(
    () => (caseId ? db.variableCharges.where('caseId').equals(caseId).toArray() : []),
    [caseId],
  )
}

export async function addVariableCharge(data: Omit<VariableCharge, 'id' | 'createdAt'>) {
  return db.variableCharges.add({ ...data, createdAt: new Date() })
}

// ── NOTES ─────────────────────────────────────────────────────────────────
export function useCaseNotes(caseId: number | undefined) {
  return useLiveQuery(
    () => (caseId ? db.notes.where('caseId').equals(caseId).reverse().sortBy('date') : []),
    [caseId],
  )
}

export async function addNote(data: Omit<Note, 'id' | 'createdAt'>) {
  const now = new Date()
  const noteId = await db.notes.add({ ...data, createdAt: now })
  await db.timeline.add({
    caseId: data.caseId, clientId: data.clientId, type: 'note',
    title: 'Note Added', description: data.content.slice(0, 100),
    date: now, referenceId: noteId as number, createdAt: now,
  })
  return noteId
}

// ── TIMELINE ──────────────────────────────────────────────────────────────
export function useCaseTimeline(caseId: number | undefined) {
  return useLiveQuery(
    () => (caseId ? db.timeline.where('caseId').equals(caseId).reverse().sortBy('date') : []),
    [caseId],
  )
}

export function useRecentTimeline(limit = 10) {
  return useLiveQuery(() => db.timeline.orderBy('createdAt').reverse().limit(limit).toArray(), [limit])
}

// ── DOCUMENTS ─────────────────────────────────────────────────────────────
export function useCaseDocuments(caseId: number | undefined) {
  return useLiveQuery(
    () => (caseId ? db.documents.where('caseId').equals(caseId).toArray() : []),
    [caseId],
  )
}

export async function addDocument(data: Omit<Document, 'id' | 'createdAt'>) {
  const now = new Date()
  const docId = await db.documents.add({ ...data, createdAt: now })
  await db.timeline.add({
    caseId: data.caseId, clientId: data.clientId, type: 'document',
    title: 'Document Added', description: data.name,
    date: now, referenceId: docId as number, createdAt: now,
  })
  return docId
}

export async function toggleDocument(id: number, checked: boolean) {
  return db.documents.update(id, { checked })
}

export async function deleteDocument(id: number) {
  return db.documents.delete(id)
}

// ── TASKS ─────────────────────────────────────────────────────────────────
export function useTasks() {
  return useLiveQuery(() => db.tasks.orderBy('dueDate').toArray(), [])
}

export function usePendingTasks() {
  return useLiveQuery(
    () => db.tasks.where('status').notEqual('Completed').sortBy('dueDate'),
    [],
  )
}

export async function addTask(data: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) {
  const now = new Date()
  return db.tasks.add({ ...data, createdAt: now, updatedAt: now })
}

export async function updateTask(id: number, data: Partial<Task>) {
  return db.tasks.update(id, { ...data, updatedAt: new Date() })
}

export async function deleteTask(id: number) {
  return db.tasks.delete(id)
}

// ── COMMUNICATIONS ────────────────────────────────────────────────────────
export function useClientCommunications(clientId: number | undefined) {
  return useLiveQuery(
    () => (clientId ? db.communications.where('clientId').equals(clientId).reverse().sortBy('date') : []),
    [clientId],
  )
}

export async function addCommunication(data: Omit<Communication, 'id' | 'createdAt'>) {
  const now = new Date()
  return db.communications.add({ ...data, createdAt: now })
}

// ── REMINDERS ─────────────────────────────────────────────────────────────
export function useUpcomingReminders() {
  return useLiveQuery(
    () => db.reminders.where('status').equals('Upcoming').sortBy('reminderTime'),
    [],
  )
}

// ── SETTINGS ──────────────────────────────────────────────────────────────
export function useSetting(key: string) {
  return useLiveQuery(
    () => db.settings.where('key').equals(key).first().then(s => s?.value),
    [key],
  )
}

export async function saveSetting(key: string, value: string) {
  const existing = await db.settings.where('key').equals(key).first()
  if (existing?.id) {
    return db.settings.update(existing.id, { value })
  }
  return db.settings.add({ key, value })
}

// ── AGGREGATE STATS ───────────────────────────────────────────────────────
export function useStats() {
  return useLiveQuery(async () => {
    const [clients, cases, todayHearings, payments, tasks] = await Promise.all([
      db.clients.count(),
      db.cases.where('status').notEqual('Closed').count(),
      db.hearings.where('date').between(startOfDay(new Date()), endOfDay(new Date()), true, true).count(),
      db.payments.toArray(),
      db.tasks.where('status').notEqual('Completed').toArray(),
    ])

    const allCases = await db.cases.toArray()
    const allPayments = await db.payments.toArray()
    const allVariableCharges = await db.variableCharges.toArray()
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const newCasesThisMonth = allCases.filter(c => new Date(c.createdAt) >= startOfMonth).length

    let totalFees = 0, collectedFees = 0
    for (const c of allCases) {
      totalFees += c.fixedFee
      const charges = allVariableCharges.filter(v => v.caseId === c.id).reduce((sum, v) => sum + v.amount, 0)
      totalFees += charges
    }
    for (const p of allPayments) collectedFees += p.amount
    const pendingFees = totalFees - collectedFees

    return { totalClients: clients, activeCases: cases, todayHearings, pendingFees, newCasesThisMonth, pendingTasks: tasks.length }
  }, [])
}

export function usePendingCollections() {
  return useLiveQuery(async () => {
    const clients = await db.clients.toArray()
    const cases = await db.cases.toArray()
    const payments = await db.payments.toArray()
    const variableCharges = await db.variableCharges.toArray()

    const result = []
    for (const client of clients) {
      const clientCases = cases.filter(c => c.clientId === client.id)
      let totalFees = 0
      for (const c of clientCases) {
        totalFees += c.fixedFee
        totalFees += variableCharges.filter(v => v.caseId === c.id).reduce((s, v) => s + v.amount, 0)
      }
      const collected = payments.filter(p => p.clientId === client.id).reduce((s, p) => s + p.amount, 0)
      const pending = totalFees - collected
      if (pending > 0) {
        const lastPayment = payments.filter(p => p.clientId === client.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]
        const daysOutstanding = lastPayment ? Math.floor((Date.now() - new Date(lastPayment.date).getTime()) / 86400000) : Math.floor((Date.now() - new Date(client.createdAt).getTime()) / 86400000)
        result.push({ client, pending, daysOutstanding })
      }
    }
    return result.sort((a, b) => b.pending - a.pending).slice(0, 10)
  }, [])
}

// ── SEARCH ─────────────────────────────────────────────────────────────────
export async function globalSearch(query: string) {
  if (!query || query.length < 2) return { clients: [], cases: [] }
  const q = query.toLowerCase()
  const [clients, cases] = await Promise.all([
    db.clients.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.mobile.includes(q) ||
      (c.email?.toLowerCase().includes(q) ?? false)
    ).toArray(),
    db.cases.filter(c =>
      c.title.toLowerCase().includes(q) ||
      (c.caseNumber?.toLowerCase().includes(q) ?? false) ||
      c.courtName.toLowerCase().includes(q) ||
      (c.oppositeParty?.toLowerCase().includes(q) ?? false)
    ).toArray(),
  ])
  return { clients: clients.slice(0, 5), cases: cases.slice(0, 5) }
}
