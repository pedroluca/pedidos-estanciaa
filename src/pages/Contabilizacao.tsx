import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface ProdutoContabilizado {
  produto: string;
  imagem: string | null;
  quantidade_total: number;
  total_pedidos: number;
}

interface ContabilizacaoData {
  data: string;
  total_produtos: number;
  produtos: ProdutoContabilizado[];
}

export function Contabilizacao() {
  const [data, setData] = useState<ContabilizacaoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSelecionada, setDataSelecionada] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [statusFilter, setStatusFilter] = useState<string[]>(['Finalizado']);
  const navigate = useNavigate();

  const loadContabilizacao = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter.length > 0 ? statusFilter.join(',') : undefined;
      const response = await api.getContabilizacao(dataSelecionada, statusParam);
      setData(response);
    } catch (error) {
      console.error('Erro ao carregar contabilização:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContabilizacao();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada, statusFilter]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const todosStatus = ['Aguardando', 'Em Produção', 'Agendado', 'Saiu para Entrega', 'Esperando Retirada', 'Cancelado', 'Finalizado'];

  const statusColors: Record<string, string> = {
    "Em Produção": "bg-orange-500",
    "Aguardando": "bg-cyan-600",
    "Agendado": "bg-purple-600",
    "Finalizado": "bg-green-700",
    "Cancelado": "bg-red-700",
    "Saiu para Entrega": "bg-yellow-600",
    "Esperando Retirada": "bg-lime-600",
  };

  const toggleStatus = (status: string) => {
    setStatusFilter(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="text-zinc-400 hover:text-white transition"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <Package size={28} />
                Contabilização de Produtos
              </h1>
              <p className="text-sm text-zinc-400">
                Visualize a quantidade total de produtos agendados por dia
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filtro de Data */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-4">
            <Calendar className="text-emerald-500" size={24} />
            <div className="flex-1">
              <label className="block text-sm text-zinc-400 mb-2">
                Selecione a data:
              </label>
              <input
                type="date"
                value={dataSelecionada}
                onChange={(e) => setDataSelecionada(e.target.value)}
                className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 w-64"
              />
            </div>
            {data && (
              <div className="text-right">
                <p className="text-sm text-zinc-400">Total de produtos:</p>
                <p className="text-3xl font-bold text-white">{data.total_produtos}</p>
              </div>
            )}
          </div>
        </div>

        {/* Filtros de Status */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
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

        {/* Lista de Produtos */}
        {loading ? (
          <div className="text-center text-white py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-white mx-auto mb-3"></div>
            <p>Carregando contabilização...</p>
          </div>
        ) : !data || data.produtos.length === 0 ? (
          <div className="text-center text-zinc-400 py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
            <Package className="mx-auto mb-4 text-zinc-600" size={48} />
            <p className="text-lg">Nenhum produto encontrado para {formatDate(dataSelecionada)}</p>
            <p className="text-sm mt-2">
              Não há pedidos agendados para esta data ou todos foram cancelados
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            {/* Header da Tabela */}
            <div className="bg-zinc-800 px-6 py-4 grid grid-cols-12 gap-4 font-semibold text-zinc-300 text-sm">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-2">Imagem</div>
              <div className="col-span-5">Produto</div>
              <div className="col-span-2 text-center">Quantidade Total</div>
              <div className="col-span-2 text-center">Nº de Pedidos</div>
            </div>

            {/* Linhas da Tabela */}
            <div className="divide-y divide-zinc-800">
              {data.produtos.map((produto, index) => (
                <div
                  key={index}
                  className="px-6 py-4 grid grid-cols-12 gap-4 items-center hover:bg-zinc-800/50 transition"
                >
                  <div className="col-span-1 text-center text-zinc-400 font-mono">
                    {index + 1}
                  </div>
                  <div className="col-span-2">
                    <img
                      src={produto.imagem || 'https://placehold.co/100x100?text=Sem+Imagem'}
                      alt={produto.produto}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  </div>
                  <div className="col-span-5">
                    <h3 className="text-white font-medium text-lg">{produto.produto}</h3>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-block bg-emerald-700 text-white px-4 py-2 rounded-lg font-bold text-xl">
                      {produto.quantidade_total}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="text-zinc-400 text-sm">
                      {produto.total_pedidos} {produto.total_pedidos === 1 ? 'pedido' : 'pedidos'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer da Tabela */}
            <div className="bg-zinc-800 px-6 py-4 flex items-center justify-between">
              <p className="text-zinc-400">
                Exibindo {data.produtos.length} {data.produtos.length === 1 ? 'produto' : 'produtos'}
              </p>
              <p className="text-zinc-400">
                Data: <span className="text-white font-medium">{formatDate(data.data)}</span>
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
