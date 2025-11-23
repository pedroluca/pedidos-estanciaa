import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Painel } from './pages/Painel';
import { NovoPedido } from './pages/NovoPedido';
import { Contabilizacao } from './pages/Contabilizacao';
import { Estoque } from './pages/Estoque';
import { AudioCardsList } from './pages/AudioCards/AudioCardsList';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/painel" element={<Painel />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/novo-pedido"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <NovoPedido />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/contabilizacao"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Contabilizacao />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/estoque"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Estoque />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/audio-cards"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <AudioCardsList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
