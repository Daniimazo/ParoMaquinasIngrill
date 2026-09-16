import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider, useStore, canAccess, canManageUsers } from './store'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MaquinasPage from './pages/MaquinasPage'
import HerramientasPage from './pages/HerramientasPage'
import ListasPage from './pages/ListasPage'
import UsuariosPage from './pages/UsuariosPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useStore()
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, currentUser } = useStore()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return currentUser === 'admin' ? <>{children}</> : <Navigate to="/maquinas" replace />
}

function UserAdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, currentUser, users } = useStore()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return canManageUsers(currentUser, users) ? <>{children}</> : <Navigate to="/maquinas" replace />
}

function PermissionRoute({ resource, children }: { resource: Parameters<typeof canAccess>[2]; children: React.ReactNode }) {
  const { isLoggedIn, currentUser, users } = useStore()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return canAccess(currentUser, users, resource) ? <>{children}</> : <Navigate to="/" replace />
}

function AppRoutes() {
  const { isLoggedIn } = useStore()
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/maquinas" element={<PermissionRoute resource="machines.summary"><Layout><MaquinasPage /></Layout></PermissionRoute>} />
      <Route path="/herramientas" element={<PermissionRoute resource="tools.panel"><Layout><HerramientasPage /></Layout></PermissionRoute>} />
      <Route path="/listas" element={<ProtectedRoute><Layout><ListasPage /></Layout></ProtectedRoute>} />
      <Route path="/usuarios" element={<UserAdminRoute><Layout><UsuariosPage /></Layout></UserAdminRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  )
}
