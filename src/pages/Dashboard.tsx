import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';
import type { Pedido } from '../types';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'todos' | 'hoje' | 'futuro'>('hoje');

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const data = await api.getPedidos();
      setPedidos(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, []);

  const hoje = new Date().toISOString().split('T')[0];
  
  const pedidosFiltrados = pedidos.filter(p => {
    if (filter === 'hoje') return p.data_agendamento === hoje;
    if (filter === 'futuro') return p.data_agendamento > hoje;
    return true;
  });

  const statusColors: Record<string, string> = {
    "Em Produção": "bg-green-600",
    "Aguardando": "bg-amber-600",
    "Agendado": "bg-purple-600",
    "Finalizado": "bg-red-700",
    "Saiu para Entrega": "bg-yellow-600",
    "Esperando Retirada": "bg-lime-600",
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Dashboard - Floricultura Estância-A</h1>
            <p className="text-sm text-zinc-400">Bem-vindo, {user?.nome}</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/painel"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition"
            >
              Ver Painel
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <LogOut size={18} />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Ações */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('todos')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'todos' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('hoje')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'hoje' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => setFilter('futuro')}
              className={`px-4 py-2 rounded-lg transition ${
                filter === 'futuro' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
              }`}
            >
              Futuros
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={loadPedidos}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition flex items-center gap-2"
            >
              <RefreshCw size={18} />
              Atualizar
            </button>
            <Link
              to="/dashboard/novo-pedido"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2"
            >
              <Plus size={18} />
              Novo Pedido
            </Link>
          </div>
        </div>

        {/* Lista de Pedidos */}
        {loading ? (
          <div className="text-center text-white py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-white mx-auto mb-3"></div>
            <p>Carregando pedidos...</p>
          </div>
        ) : pedidosFiltrados.length === 0 ? (
          <div className="text-center text-zinc-400 py-12">
            <p className="text-lg">Nenhum pedido encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pedidosFiltrados.map((pedido) => (
              <div
                key={pedido.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      Pedido #{pedido.numero_pedido}
                    </h3>
                    <p className="text-sm text-zinc-400">{pedido.nome_cliente}</p>
                  </div>
                  <span className={`${statusColors[pedido.status] || 'bg-gray-600'} text-white text-xs px-2 py-1 rounded`}>
                    {pedido.status}
                  </span>
                </div>

                <div className="text-sm text-zinc-400 space-y-1 mb-3">
                  <p>📅 {new Date(pedido.data_agendamento).toLocaleDateString('pt-BR')}</p>
                  <p>🕐 {pedido.horario_agendamento}</p>
                  <p>📦 {pedido.itens.length} item(s)</p>
                  <p>💰 R$ {pedido.valor_total.toFixed(2)}</p>
                </div>

                {/* Miniaturas dos itens */}
                <div className="flex gap-1 mb-3">
                  {pedido.itens.slice(0, 3).map((item, idx) => (
                    <img
                      key={idx}
                      src={item.imagem || 'https://placehold.co/100x100?text=Sem+Imagem'}
                      alt={item.nome}
                      className="w-16 h-16 object-cover rounded"
                    />
                  ))}
                  {pedido.itens.length > 3 && (
                    <div className="w-16 h-16 bg-zinc-800 rounded flex items-center justify-center text-zinc-400 text-sm">
                      +{pedido.itens.length - 3}
                    </div>
                  )}
                </div>

                <button className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition">
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
