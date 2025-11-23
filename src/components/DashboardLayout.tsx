import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, DollarSign, Package, Music, LogOut, Menu, X, Eye } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/painel', icon: Eye, label: 'Painel' },
    { path: '/dashboard/novo-pedido', icon: ShoppingBag, label: 'Novo Pedido' },
    { path: '/dashboard/contabilizacao', icon: DollarSign, label: 'Contabilização' },
    { path: '/dashboard/estoque', icon: Package, label: 'Estoque' },
    { path: '/dashboard/audio-cards', icon: Music, label: 'Cartões de Áudio' },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 flex text-zinc-100">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-zinc-900 border-r border-zinc-800 
        transform transition-transform duration-200 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-white">Estância-A</h1>
              <p className="text-xs text-zinc-500">Painel Administrativo</p>
            </div>
            <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-zinc-400">
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-pink-600 text-white'
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-800">
            <div className="flex items-center gap-3 px-4 py-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-pink-500">
                {user?.nome?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.nome}</p>
                <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-2 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between">
          <button onClick={() => setIsSidebarOpen(true)} className="text-zinc-400">
            <Menu size={24} />
          </button>
          <span className="font-bold">Estância-A</span>
          <div className="w-6" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
