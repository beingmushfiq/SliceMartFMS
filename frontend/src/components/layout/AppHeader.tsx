import { useState } from 'react'
import {
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Sun,
  User as UserIcon,
} from 'lucide-react'
import { useAuthStore } from '../../lib/auth/authStore'

interface AppHeaderProps {
  onToggleSidebar: () => void
}

export function AppHeader({ onToggleSidebar }: AppHeaderProps) {
  const { user, tenant, branches, activeBranch, switchBranch, logout } = useAuthStore()
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isBranchMenuOpen, setIsBranchMenuOpen] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-md sm:px-6">
      {/* Left side: Hamburger + Tenant info */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100 lg:hidden"
          aria-label="Toggle Navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {tenant && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-sm">
              {tenant.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="hidden sm:block">
              <span className="text-sm font-semibold text-zinc-100">{tenant.name}</span>
              <span className="ml-2 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium text-zinc-400">
                {tenant.currency_code}
              </span>
            </div>
          </div>
        )}

        {/* Branch Selector Dropdown */}
        {branches && branches.length > 1 && (
          <div className="relative ml-2">
            <button
              type="button"
              onClick={() => setIsBranchMenuOpen(!isBranchMenuOpen)}
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/60 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              <Building2 className="h-3.5 w-3.5 text-zinc-400" />
              <span>{activeBranch?.name ?? 'Select Branch'}</span>
              <ChevronDown className="h-3 w-3 text-zinc-500" />
            </button>

            {isBranchMenuOpen && (
              <div className="absolute left-0 mt-2 w-48 rounded-xl border border-zinc-800 bg-zinc-900 p-1 shadow-2xl z-50">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                  Switch Branch
                </div>
                {branches.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      void switchBranch(b.id)
                      setIsBranchMenuOpen(false)
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs ${
                      activeBranch?.id === b.id
                        ? 'bg-emerald-500/10 text-emerald-400 font-medium'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                    }`}
                  >
                    <span>{b.name}</span>
                    {b.is_head_office && (
                      <span className="text-[9px] text-zinc-500 uppercase">HQ</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Theme toggle + User profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-100"
          aria-label="Toggle Theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* User Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-800/60"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-200">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-medium text-zinc-200">{user?.name ?? 'User'}</div>
              <div className="text-[10px] text-zinc-500 truncate max-w-[120px]">{user?.email}</div>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-zinc-500 sm:block" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-1.5 shadow-2xl z-50">
              <div className="border-b border-zinc-800/80 px-3 py-2">
                <p className="text-xs font-medium text-zinc-200">{user?.name}</p>
                <p className="text-[11px] text-zinc-500 truncate">{user?.email}</p>
              </div>

              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false)
                    void logout()
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
