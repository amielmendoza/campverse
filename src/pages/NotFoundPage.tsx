import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4">
      <h1 className="text-6xl font-bold text-emerald-700">404</h1>
      <p className="mt-4 text-lg text-stone-500">
        Looks like you wandered off the trail.
      </p>
      <Link
        to="/locations"
        className="mt-6 rounded-lg bg-emerald-600 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
      >
        Back to Camp
      </Link>
    </div>
  )
}
