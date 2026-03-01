import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard } from './components/auth/AuthGuard'
import { AppShell } from './components/layout/AppShell'
import { AdminGuard } from './components/auth/AdminGuard'
import { LoadingSpinner } from './components/ui/LoadingSpinner'

const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/SignupPage').then(m => ({ default: m.SignupPage })))
const LocationsPage = lazy(() => import('./pages/LocationsPage').then(m => ({ default: m.LocationsPage })))
const LocationDetailPage = lazy(() => import('./pages/LocationDetailPage').then(m => ({ default: m.LocationDetailPage })))
const ProfilePage = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })))
const AdminLocationsPage = lazy(() => import('./pages/AdminLocationsPage').then(m => ({ default: m.AdminLocationsPage })))
const MyLocationsPage = lazy(() => import('./pages/MyLocationsPage').then(m => ({ default: m.MyLocationsPage })))
const MyBookingsPage = lazy(() => import('./pages/MyBookingsPage').then(m => ({ default: m.MyBookingsPage })))
const OwnerBookingsPage = lazy(() => import('./pages/OwnerBookingsPage').then(m => ({ default: m.OwnerBookingsPage })))

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route element={<AuthGuard />}>
              <Route element={<AppShell />}>
                <Route path="/locations" element={<LocationsPage />} />
                <Route path="/locations/:slug" element={<LocationDetailPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my-locations" element={<MyLocationsPage />} />
                <Route path="/my-locations/bookings" element={<OwnerBookingsPage />} />
                <Route path="/my-bookings" element={<MyBookingsPage />} />
                <Route element={<AdminGuard />}>
                  <Route path="/admin/locations" element={<AdminLocationsPage />} />
                </Route>
              </Route>
            </Route>
            <Route path="/" element={<Navigate to="/locations" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
