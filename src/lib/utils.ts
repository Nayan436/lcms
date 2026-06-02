import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow, isToday, isTomorrow, isPast, addDays } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy')
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'dd MMM yyyy, hh:mm a')
}

export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`
}

export function getRelativeDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  if (isToday(d)) return 'Today'
  if (isTomorrow(d)) return 'Tomorrow'
  return formatDate(d)
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true })
}

export function getHearingStatusColor(status: string): string {
  switch (status) {
    case 'Scheduled': return 'bg-blue-100 text-blue-700 border-blue-200'
    case 'Completed': return 'bg-green-100 text-green-700 border-green-200'
    case 'Adjourned': return 'bg-orange-100 text-orange-700 border-orange-200'
    case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200'
    default: return 'bg-gray-100 text-gray-700 border-gray-200'
  }
}

export function getCaseStatusColor(status: string): string {
  switch (status) {
    case 'Drafting': return 'bg-gray-100 text-gray-700'
    case 'Filed': return 'bg-blue-100 text-blue-700'
    case 'Notice Issued': return 'bg-purple-100 text-purple-700'
    case 'Evidence': return 'bg-yellow-100 text-yellow-700'
    case 'Arguments': return 'bg-orange-100 text-orange-700'
    case 'Judgment': return 'bg-red-100 text-red-700'
    case 'Closed': return 'bg-green-100 text-green-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}

export function getTaskPriorityColor(priority: string): string {
  switch (priority) {
    case 'Urgent': return 'bg-red-100 text-red-700 border-red-300'
    case 'High': return 'bg-orange-100 text-orange-700 border-orange-300'
    case 'Medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300'
    case 'Low': return 'bg-green-100 text-green-700 border-green-300'
    default: return 'bg-gray-100 text-gray-700 border-gray-300'
  }
}

export function getTimelineIcon(type: string): string {
  switch (type) {
    case 'note': return '📝'
    case 'hearing': return '⚖️'
    case 'document': return '📄'
    case 'payment': return '💰'
    case 'status_change': return '🔄'
    case 'task': return '✅'
    case 'communication': return '📞'
    default: return '•'
  }
}

export function getDaysBetween(date: Date): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  return Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24))
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export function generateCaseSummary(casee: { title: string; caseNumber?: string; status: string; courtName: string }, clientName: string, nextHearing?: Date, pendingFee?: number): string {
  const parts = [
    `Case: ${casee.title}`,
    casee.caseNumber ? `Case No: ${casee.caseNumber}` : '',
    `Client: ${clientName}`,
    `Court: ${casee.courtName}`,
    `Status: ${casee.status}`,
    nextHearing ? `Next Hearing: ${formatDate(nextHearing)}` : '',
    pendingFee !== undefined ? `Pending Fee: ${formatCurrency(pendingFee)}` : '',
  ].filter(Boolean)
  return parts.join('\n')
}

export const CASE_TYPES = [
  'Divorce', 'Mutual Divorce', 'Maintenance', 'Child Custody',
  'Domestic Violence', '498A', 'Bail', 'Anticipatory Bail',
  'Criminal Trial', 'Appeal', 'Other',
]

export const CASE_STATUSES = [
  'Drafting', 'Filed', 'Notice Issued', 'Evidence',
  'Arguments', 'Judgment', 'Closed', 'Custom',
]

export const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Other']

export const HEARING_STATUSES = ['Scheduled', 'Completed', 'Adjourned', 'Cancelled']

export const DOCUMENT_CATEGORIES = ['FIR', 'Chargesheet', 'Evidence', 'Affidavit', 'Court Order', 'Other']

export const COMMUNICATION_TYPES = ['Call', 'Meeting', 'WhatsApp', 'Email', 'Other']

export const TASK_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent']
