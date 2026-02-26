import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { SignupForm } from '../components/auth/SignupForm'

export function SignupPage() {
  const { user, loading } = useAuth()

  if (!loading && user) {
    return <Navigate to="/locations" replace />
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold text-emerald-700">Campverse</h1>
        <p className="mt-2 text-stone-500">
          Find your tribe. Share the trail.
        </p>
      </div>
      <SignupForm />
    </div>
  )
}
