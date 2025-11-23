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
import { TelemensagensList } from './pages/Telemensagens/TelemensagensList';
import { PlayerPage } from './pages/Player/PlayerPage';

function App() {
  const isPlayerDomain = window.location.hostname === 'player.estanciaa.app.br' || window.location.hostname.startsWith('player.');

  if (isPlayerDomain) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/:id" element={<PlayerPage />} />
          <Route path="/" element={
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-2">Estância-A Player</h1>
                <p className="text-zinc-400">Utilize o link do QR Code para acessar seu cartão.</p>
              </div>
            </div>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    );
  }

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
          <Route
            path="/dashboard/telemensagens"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <TelemensagensList />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route path="/player/:id" element={<PlayerPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
