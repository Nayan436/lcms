import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  Bell,
  Plus,
  UserPlus,
  Briefcase,
  CalendarPlus,
  StickyNote,
  CreditCard,
  X,
  User,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { globalSearch } from '@/hooks/useDB'
import { useUpcomingReminders } from '@/hooks/useDB'
import { cn } from '@/lib/utils'
import type { Client, Case } from '@/db/database'

interface HeaderProps {
  onAddClient: () => void
  onAddCase: () => void
  onAddHearing: () => void
  onAddNote: () => void
  onAddPayment: () => void
}

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clients',
  '/calendar': 'Calendar',
  '/payments': 'Payments',
  '/settings': 'Settings',
}

function getPageTitle(pathname: string): string {
  if (pathname === '/' || pathname === '/dashboard') return 'Dashboard'
  const base = '/' + pathname.split('/')[1]
  return pageTitles[base] ?? 'LCMS'
}

interface SearchResults {
  clients: Client[]
  cases: Case[]
}

export default function Header({ onAddClient, onAddCase, onAddHearing, onAddNote, onAddPayment }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const reminders = useUpcomingReminders()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults>({ clients: [], cases: [] })
  const [searchOpen, setSearchOpen] = useState(false)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const searchRef = useRef<HTMLDivElement>(null)
  const newMenuRef = useRef<HTMLDivElement>(null)
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const upcomingCount = reminders?.length ?? 0

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false)
      }
      if (newMenuRef.current && !newMenuRef.current.contains(e.target as Node)) {
        setNewMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (q.length < 2) {
      setResults({ clients: [], cases: [] })
      setSearchOpen(false)
      return
    }
    searchTimeout.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearch(q)
        setResults(res)
        setSearchOpen(true)
      } finally {
        setLoading(false)
      }
    }, 250)
  }, [])

  const hasResults = results.clients.length > 0 || results.cases.length > 0

  const handleClientClick = (client: Client) => {
    setSearchOpen(false)
    setQuery('')
    navigate(`/clients/${client.id}`)
  }

  const handleCaseClick = (c: Case) => {
    setSearchOpen(false)
    setQuery('')
    navigate(`/clients/${c.clientId}/cases/${c.id}`)
  }

  const quickActions = [
    { label: 'New Client', icon: UserPlus, action: onAddClient },
    { label: 'New Case', icon: Briefcase, action: onAddCase },
    { label: 'Add Hearing', icon: CalendarPlus, action: onAddHearing },
    { label: 'Add Note', icon: StickyNote, action: onAddNote },
    { label: 'Add Payment', icon: CreditCard, action: onAddPayment },
  ]

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-4 sticky top-0 z-30">
      {/* Page Title */}
      <h1 className="text-lg font-semibold text-gray-900 min-w-[140px]">
        {getPageTitle(location.pathname)}
      </h1>

      {/* Global Search */}
      <div ref={searchRef} className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
          <Input
            type="text"
            placeholder="Search clients, cases..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => query.length >= 2 && hasResults && setSearchOpen(true)}
            className="pl-9 pr-9 h-9 bg-gray-50 border-gray-200 text-sm focus-visible:ring-blue-500"
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setSearchOpen(false); setResults({ clients: [], cases: [] }) }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Search Dropdown */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-gray-200 shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
            {loading && (
              <div className="px-4 py-3 text-sm text-gray-400">Searching...</div>
            )}
            {!loading && !hasResults && (
              <div className="px-4 py-3 text-sm text-gray-400">No results found</div>
            )}
            {!loading && results.clients.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  Clients
                </div>
                {results.clients.map((client) => (
                  <button
                    key={client.id}
                    onClick={() => handleClientClick(client)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <User className="w-3.5 h-3.5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{client.name}</p>
                      <p className="text-xs text-gray-400">{client.mobile}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {!loading && results.cases.length > 0 && (
              <div>
                <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100">
                  Cases
                </div>
                {results.cases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCaseClick(c)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-blue-50 text-left transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <Scale className="w-3.5 h-3.5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate max-w-[220px]">{c.title}</p>
                      <p className="text-xs text-gray-400">{c.courtName}{c.caseNumber ? ` · ${c.caseNumber}` : ''}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {/* Notification Bell */}
        <div className="relative">
          <button
            className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 transition-colors"
            title="Upcoming Reminders"
          >
            <Bell className="w-4.5 h-4.5 text-gray-600" size={18} />
            {upcomingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] flex items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white px-1 leading-none">
                {upcomingCount > 9 ? '9+' : upcomingCount}
              </span>
            )}
          </button>
        </div>

        {/* New Button with dropdown */}
        <div ref={newMenuRef} className="relative">
          <Button
            size="sm"
            onClick={() => setNewMenuOpen((v) => !v)}
            className="gap-1.5 h-9 px-3"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>

          {newMenuOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg border border-gray-200 shadow-lg z-50 py-1 overflow-hidden">
              {quickActions.map(({ label, icon: Icon, action }) => (
                <button
                  key={label}
                  onClick={() => {
                    setNewMenuOpen(false)
                    action()
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
