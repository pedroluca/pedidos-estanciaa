import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { LogOut, Plus, RefreshCw, X, Edit2, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useOrderPolling } from '../hooks/useOrderPolling';
import { api } from '../lib/api';
import type { Pedido } from '../types';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'hoje' | 'futuro'>('hoje');
  const [statusFilter, setStatusFilter] = useState<string[]>(['Aguardando', 'Em Produção', 'Agendado', 'Saiu para Entrega', 'Esperando Retirada']);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    data_agendamento: '',
    horario_agendamento: '',
    status: '',
    observacoes: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);

  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getPedidos();
      setPedidos(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Ativa o polling automático a cada 1 minuto
  useOrderPolling(loadPedidos);

  const syncCatalogo = async () => {
    try {
      setSyncLoading(true);
      await api.syncCatalog();
      alert('Catálogo sincronizado com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar catálogo:', error);
      alert('Erro ao sincronizar catálogo');
    } finally {
      setSyncLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
  }, [loadPedidos]);

  const hoje = new Date().toISOString().split('T')[0];
  
  const pedidosFiltrados = pedidos
    .filter(p => {
      if (filter === 'hoje') return p.data_agendamento === hoje;
      if (filter === 'futuro') return p.data_agendamento > hoje;
      return true;
    })
    .filter(p => statusFilter.includes(p.status));

  const todosStatus = ['Aguardando', 'Em Produção', 'Agendado', 'Saiu para Entrega', 'Esperando Retirada', 'Cancelado', 'Finalizado'];
  
  const toggleStatus = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const openEditMode = (pedido: Pedido) => {
    setEditData({
      data_agendamento: pedido.data_agendamento,
      horario_agendamento: pedido.horario_agendamento,
      status: pedido.status,
      observacoes: pedido.observacoes || ''
    });
    setIsEditing(true);
  };

  const closeEditMode = () => {
    setIsEditing(false);
    setEditData({
      data_agendamento: '',
      horario_agendamento: '',
      status: '',
      observacoes: ''
    });
  };

  const saveEdit = async () => {
    if (!selectedPedido) return;
    
    try {
      setSaveLoading(true);
      await api.updatePedido(selectedPedido.id, editData);
      await loadPedidos();
      // Atualiza o pedido selecionado
      const updatedPedido = { ...selectedPedido, ...editData } as Pedido;
      setSelectedPedido(updatedPedido);
      closeEditMode();
      alert('Pedido atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar pedido:', error);
      alert('Erro ao atualizar pedido');
    } finally {
      setSaveLoading(false);
    }
  };

  const statusColors: Record<string, string> = {
    "Em Produção": "bg-orange-500",
    "Aguardando": "bg-cyan-600",
    "Agendado": "bg-purple-600",
    "Finalizado": "bg-green-700",
    "Cancelado": "bg-red-700",
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
            <Link
              to="/dashboard/contabilizacao"
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition"
            >
              Contabilização
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
        <div className="flex items-center justify-between mb-4">
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
              onClick={syncCatalogo}
              className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
              disabled={syncLoading}
            >
              <RefreshCw size={18} className={syncLoading ? 'animate-spin' : ''} />
              {syncLoading ? 'Sincronizando...' : 'Sincronizar Catálogo'}
            </button>
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

        {/* Filtros de Status */}
        <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Filtrar por Status:</h3>
          <div className="flex flex-wrap gap-2">
            {todosStatus.map((status) => (
              <button
                key={status}
                onClick={() => toggleStatus(status)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  statusFilter.includes(status)
                    ? `${statusColors[status] || 'bg-gray-600'} text-white`
                    : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-2">
            {statusFilter.length === 0 ? 'Nenhum status selecionado' : `${statusFilter.length} status selecionado(s)`}
          </p>
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
                  <p>📅 {pedido.data_agendamento.split('-').reverse().join('/')}</p>
                  <p>🕐 {pedido.horario_agendamento}</p>
                  <p>📦 {pedido.itens?.length || 0} item(s)</p>
                  <p>💰 R$ {Number(pedido.valor_total || 0).toFixed(2)}</p>
                </div>

                {/* Miniaturas dos itens */}
                {pedido.itens && pedido.itens.length > 0 && (
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
                )}

                <button 
                  onClick={() => setSelectedPedido(pedido)}
                  className="w-full px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg text-sm transition"
                >
                  Ver Detalhes
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Modal de Detalhes */}
        {selectedPedido && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-[90%] max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Header do Modal */}
              <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Pedido #{selectedPedido.numero_pedido}</h2>
                  <p className="text-zinc-400">{selectedPedido.nome_cliente}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!isEditing ? (
                    <button
                      onClick={() => openEditMode(selectedPedido)}
                      className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition flex items-center gap-2"
                    >
                      <Edit2 size={18} />
                      Editar
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={saveEdit}
                        disabled={saveLoading}
                        className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-700 text-white rounded-lg transition flex items-center gap-2"
                      >
                        <Save size={18} />
                        {saveLoading ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        onClick={closeEditMode}
                        disabled={saveLoading}
                        className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 text-white rounded-lg transition"
                      >
                        Cancelar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setSelectedPedido(null);
                      closeEditMode();
                    }}
                    className="text-zinc-400 hover:text-white transition"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              {/* Conteúdo do Modal */}
              <div className="p-6 space-y-6">
                {/* Informações Gerais */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-zinc-500">Status</p>
                    {isEditing ? (
                      <select
                        value={editData.status}
                        onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                        className="mt-1 w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      >
                        {todosStatus.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className={`inline-block mt-1 ${statusColors[selectedPedido.status] || 'bg-gray-600'} text-white text-sm px-3 py-1 rounded`}>
                        {selectedPedido.status}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Tipo de Entrega</p>
                    <p className="text-white font-medium">{selectedPedido.tipo_entrega}</p>
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Data Agendada</p>
                    {isEditing ? (
                      <input
                        type="date"
                        value={editData.data_agendamento}
                        onChange={(e) => setEditData({ ...editData, data_agendamento: e.target.value })}
                        className="mt-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white font-medium">{selectedPedido.data_agendamento.split('-').reverse().join('/')}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-zinc-500">Horário</p>
                    {isEditing ? (
                      <input
                        type="time"
                        value={editData.horario_agendamento}
                        onChange={(e) => setEditData({ ...editData, horario_agendamento: e.target.value })}
                        className="mt-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-white font-medium">{selectedPedido.horario_agendamento}</p>
                    )}
                  </div>
                  {selectedPedido.telefone_cliente && (
                    <div>
                      <p className="text-sm text-zinc-500">Telefone</p>
                      <p className="text-white font-medium">{selectedPedido.telefone_cliente}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-zinc-500">Valor Total</p>
                    <p className="text-white font-medium text-lg">R$ {Number(selectedPedido.valor_total || 0).toFixed(2)}</p>
                  </div>
                </div>

                {/* Endereço de Entrega */}
                {selectedPedido.endereco_entrega && (
                  <div>
                    <p className="text-sm text-zinc-500 mb-1">Endereço de Entrega</p>
                    <p className="text-white bg-zinc-800 p-3 rounded-lg">{selectedPedido.endereco_entrega}</p>
                  </div>
                )}

                {/* Observações */}
                <div>
                  <p className="text-sm text-zinc-500 mb-1">Observações</p>
                  {isEditing ? (
                    <textarea
                      value={editData.observacoes}
                      onChange={(e) => setEditData({ ...editData, observacoes: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg p-3 focus:outline-none focus:border-blue-500 min-h-[100px]"
                      placeholder="Adicione observações sobre o pedido..."
                    />
                  ) : selectedPedido.observacoes ? (
                    <p className="text-white bg-zinc-800 p-3 rounded-lg">{selectedPedido.observacoes}</p>
                  ) : (
                    <p className="text-zinc-500 bg-zinc-800 p-3 rounded-lg italic">Sem observações</p>
                  )}
                </div>

                {/* Itens do Pedido */}
                <div>
                  <h3 className="text-lg font-semibold text-white mb-3">Itens do Pedido</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedPedido.itens && selectedPedido.itens.length > 0 ? (
                      selectedPedido.itens.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-zinc-800 rounded-xl p-4 border border-zinc-700">
                          <img
                            src={item.imagem || 'https://placehold.co/200x200?text=Sem+Imagem'}
                            alt={item.nome}
                            className="w-24 h-24 object-cover rounded-xl shrink-0"
                          />
                          <div className="flex-1">
                            <h3 className="text-white font-medium mb-1">{item.nome}</h3>
                            <p className="text-zinc-400 text-sm">Quantidade: {item.quantidade}</p>
                            {item.observacoes && (
                              <p className="text-zinc-500 text-xs mt-2">{item.observacoes}</p>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 text-center text-zinc-500 py-8">
                        Nenhum item cadastrado neste pedido
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
