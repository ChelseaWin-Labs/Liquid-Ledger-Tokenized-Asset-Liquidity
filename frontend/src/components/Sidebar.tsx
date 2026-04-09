import { Link, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Wallet, 
  ArrowUpDown, 
  Coins, 
  CreditCard 
} from 'lucide-react'
import { cn } from '@/utils/cn'

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Wallet', href: '/wallet', icon: Wallet },
  { name: 'Transactions', href: '/transactions', icon: ArrowUpDown },
  { name: 'Assets', href: '/assets', icon: Coins },
  { name: 'Card', href: '/card', icon: CreditCard },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center h-16 px-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">Liquid Ledger</h1>
      </div>
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href
          return (
            <Link
              key={item.name}
              to={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5',
                  isActive ? 'text-primary-foreground' : 'text-gray-400 group-hover:text-gray-500'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
