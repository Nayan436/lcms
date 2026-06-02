import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  IndianRupee,
  Settings,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Clients', icon: Users, path: '/clients' },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
  { label: 'Payments', icon: IndianRupee, path: '/payments' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white border-t border-gray-200 safe-area-inset-bottom">
      <div className="flex items-stretch">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center py-2 gap-0.5 min-h-[56px] transition-colors',
                active
                  ? 'text-blue-600'
                  : 'text-gray-400 hover:text-gray-600'
              )}
            >
              <Icon
                className={cn('w-6 h-6', active ? 'text-blue-600' : 'text-gray-400')}
              />
              <span className={cn('text-xs font-medium leading-none', active ? 'text-blue-600' : 'text-gray-400')}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
