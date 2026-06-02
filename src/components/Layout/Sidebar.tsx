import { useNavigate, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calendar,
  IndianRupee,
  Settings,
  Scale,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Clients', icon: Users, path: '/clients' },
  { label: 'Calendar', icon: Calendar, path: '/calendar' },
  { label: 'Payments', icon: IndianRupee, path: '/payments' },
  { label: 'Settings', icon: Settings, path: '/settings' },
]

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <aside className="flex h-screen w-64 flex-col bg-white border-r border-gray-200 fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-blue-600">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-base font-bold text-gray-900 leading-tight">LCMS</p>
          <p className="text-[10px] text-gray-400 leading-tight">Legal Case Management</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon
                className={cn(
                  'w-4.5 h-4.5 flex-shrink-0',
                  active ? 'text-blue-600' : 'text-gray-400'
                )}
                size={18}
              />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100">
        <p className="text-[11px] text-gray-400">LCMS v1.0</p>
      </div>
    </aside>
  )
}
