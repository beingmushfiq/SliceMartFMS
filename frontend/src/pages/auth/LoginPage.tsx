import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useLocation, useNavigate } from 'react-router-dom'
import { AlertCircle, Eye, EyeOff, Lock, Mail, Package } from 'lucide-react'
import { useAuthStore } from '../../lib/auth/authStore'
import { isApiError } from '../../lib/api/errors'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()
  const location = useLocation()

  interface LocationState {
    from?: {
      pathname?: string
    }
  }

  const state = location.state as LocationState | null
  const from = state?.from?.pathname ?? '/catalogue'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null)
    setIsLoading(true)
    try {
      await login({
        email: values.email,
        password: values.password,
      })
      navigate(from, { replace: true })
    } catch (err: unknown) {
      if (isApiError(err)) {
        if (err.code === 'UNAUTHENTICATED') {
          setServerError('Invalid email or password. Please check your credentials.')
        } else if (err.code === 'ACCOUNT_INACTIVE') {
          setServerError('Your user account has been deactivated. Contact your administrator.')
        } else if (err.code === 'TENANT_INACTIVE') {
          setServerError('Your organization account is suspended.')
        } else {
          setServerError(err.message ?? 'Authentication failed. Please try again.')
        }
      } else if (err instanceof Error) {
        setServerError(err.message)
      } else {
        setServerError('Unable to sign in. Please verify your connection.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-zinc-950 px-4 py-12 text-zinc-100 sm:px-6 lg:px-8">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-96 w-96 rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 h-80 w-80 rounded-full bg-teal-500/10 blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-8 shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Package className="h-6 w-6 text-zinc-950 font-bold" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            SliceMart FMS
          </h2>
          <p className="mt-1 text-xs text-zinc-400">
            Sign in to access your tenant workspace
          </p>
        </div>

        {/* Server error alert banner */}
        {serverError && (
          <div className="flex items-center gap-2.5 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 text-xs text-rose-300 animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
            <p className="leading-snug">{serverError}</p>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300">
              Email Address
            </label>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                autoComplete="email"
                placeholder="operator@acme.test"
                {...register('email')}
                className={`block w-full rounded-xl border bg-zinc-950/80 py-2.5 pr-3.5 pl-10 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  errors.email
                    ? 'border-rose-500/80 focus:border-rose-500'
                    : 'border-zinc-800 focus:border-emerald-500'
                }`}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-rose-400">{errors.email.message}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-300">
                Password
              </label>
            </div>
            <div className="relative rounded-xl shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-zinc-500">
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                {...register('password')}
                className={`block w-full rounded-xl border bg-zinc-950/80 py-2.5 pr-10 pl-10 text-xs text-zinc-100 placeholder-zinc-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${
                  errors.password
                    ? 'border-rose-500/80 focus:border-rose-500'
                    : 'border-zinc-800 focus:border-emerald-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-zinc-300"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-[11px] text-rose-400">{errors.password.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 py-3 px-4 text-xs font-semibold text-zinc-950 shadow-md shadow-emerald-500/20 transition-all hover:from-emerald-400 hover:to-teal-500 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign in to Workspace</span>
            )}
          </button>
        </form>

        <div className="border-t border-zinc-800/80 pt-4 text-center">
          <p className="text-[11px] text-zinc-500">
            SliceMart FMS &bull; Multi-tenant Enterprise ERP
          </p>
        </div>
      </div>
    </div>
  )
}
