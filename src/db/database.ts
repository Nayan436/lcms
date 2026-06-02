import Dexie, { type Table } from 'dexie'

export interface Client {
  id?: number
  name: string
  mobile: string
  email?: string
  address?: string
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Case {
  id?: number
  clientId: number
  title: string
  caseNumber?: string
  caseType: string
  courtName: string
  oppositeParty?: string
  status: string
  filingDate?: Date
  nextHearingDate?: Date
  fixedFee: number
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface Hearing {
  id?: number
  caseId: number
  clientId: number
  date: Date
  time: string
  courtNumber?: string
  judgeName?: string
  remarks?: string
  status: 'Scheduled' | 'Completed' | 'Adjourned' | 'Cancelled'
  createdAt: Date
  updatedAt: Date
}

export interface Note {
  id?: number
  caseId: number
  clientId: number
  content: string
  date: Date
  createdAt: Date
}

export interface TimelineEntry {
  id?: number
  caseId: number
  clientId: number
  type: 'note' | 'hearing' | 'document' | 'payment' | 'status_change' | 'task' | 'communication'
  title: string
  description?: string
  date: Date
  referenceId?: number
  createdAt: Date
}

export interface Payment {
  id?: number
  caseId: number
  clientId: number
  amount: number
  date: Date
  paymentMode: 'Cash' | 'UPI' | 'Bank Transfer' | 'Cheque' | 'Other'
  remarks?: string
  createdAt: Date
}

export interface VariableCharge {
  id?: number
  caseId: number
  label: string
  amount: number
  date: Date
  createdAt: Date
}

export interface Document {
  id?: number
  caseId: number
  clientId: number
  name: string
  category: string
  fileData?: ArrayBuffer
  fileType?: string
  fileSize?: number
  checked: boolean
  createdAt: Date
}

export interface Task {
  id?: number
  caseId?: number
  clientId?: number
  title: string
  description?: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Pending' | 'In Progress' | 'Completed'
  dueDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface Communication {
  id?: number
  caseId?: number
  clientId: number
  type: 'Call' | 'Meeting' | 'WhatsApp' | 'Email' | 'Other'
  content: string
  date: Date
  createdAt: Date
}

export interface Reminder {
  id?: number
  hearingId: number
  caseId: number
  clientId: number
  title: string
  reminderTime: Date
  status: 'Upcoming' | 'Missed' | 'Completed'
  notified: boolean
  createdAt: Date
}

export interface Settings {
  id?: number
  key: string
  value: string
}

class LCMSDatabase extends Dexie {
  clients!: Table<Client>
  cases!: Table<Case>
  hearings!: Table<Hearing>
  notes!: Table<Note>
  timeline!: Table<TimelineEntry>
  payments!: Table<Payment>
  variableCharges!: Table<VariableCharge>
  documents!: Table<Document>
  tasks!: Table<Task>
  communications!: Table<Communication>
  reminders!: Table<Reminder>
  settings!: Table<Settings>

  constructor() {
    super('LCMSDatabase')
    this.version(1).stores({
      clients: '++id, name, mobile, createdAt',
      cases: '++id, clientId, status, caseType, nextHearingDate, createdAt',
      hearings: '++id, caseId, clientId, date, status, createdAt',
      notes: '++id, caseId, clientId, date, createdAt',
      timeline: '++id, caseId, clientId, type, date, createdAt',
      payments: '++id, caseId, clientId, date, createdAt',
      variableCharges: '++id, caseId, createdAt',
      documents: '++id, caseId, clientId, category, createdAt',
      tasks: '++id, caseId, clientId, status, priority, dueDate, createdAt',
      communications: '++id, caseId, clientId, type, date, createdAt',
      reminders: '++id, hearingId, caseId, clientId, reminderTime, status, createdAt',
      settings: '++id, key',
    })
  }
}

export const db = new LCMSDatabase()

// Check if demo data needs to be seeded
export async function initializeDatabase() {
  const count = await db.clients.count()
  if (count === 0) {
    const { seedDemoData } = await import('./demoData')
    await seedDemoData()
  }
}
