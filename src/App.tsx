import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider, useStore } from './store'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MaquinasPage from './pages/MaquinasPage'
import HerramientasPage from './pages/HerramientasPage'
import ListasPage from './pages/ListasPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useStore()
  return isLoggedIn ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, currentUser } = useStore()
  if (!isLoggedIn) return <Navigate to="/login" replace />
  return currentUser === 'admin' ? <>{children}</> : <Navigate to="/maquinas" replace />
}

function AppRoutes() {
  const { isLoggedIn } = useStore()
  return (
    <Routes>
      <Route path="/login" element={isLoggedIn ? <Navigate to="/maquinas" replace /> : <LoginPage />} />
      <Route path="/" element={<ProtectedRoute><Layout><DashboardPage /></Layout></ProtectedRoute>} />
      <Route path="/maquinas" element={<ProtectedRoute><Layout><MaquinasPage /></Layout></ProtectedRoute>} />
      <Route path="/herramientas" element={<ProtectedRoute><Layout><HerramientasPage /></Layout></ProtectedRoute>} />
      <Route path="/listas" element={<AdminRoute><Layout><ListasPage /></Layout></AdminRoute>} />
      <Route path="*" element={<Navigate to="/maquinas" replace />} />
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
