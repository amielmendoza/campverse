import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { AuthGuard } from './components/auth/AuthGuard'
import { AppShell } from './components/layout/AppShell'
import { LoginPage } from './pages/LoginPage'
import { SignupPage } from './pages/SignupPage'
import { LocationsPage } from './pages/LocationsPage'
import { LocationDetailPage } from './pages/LocationDetailPage'
import { ProfilePage } from './pages/ProfilePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { AdminGuard } from './components/auth/AdminGuard'
import { AdminLocationsPage } from './pages/AdminLocationsPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route element={<AuthGuard />}>
            <Route element={<AppShell />}>
              <Route path="/locations" element={<LocationsPage />} />
              <Route path="/locations/:slug" element={<LocationDetailPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route element={<AdminGuard />}>
                <Route path="/admin/locations" element={<AdminLocationsPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="/" element={<Navigate to="/locations" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
