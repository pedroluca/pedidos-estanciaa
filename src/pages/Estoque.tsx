import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Package, AlertTriangle, Minus, Trash2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';

interface ProdutoEstoque {
  id: number;
  item_id: number | null;
  nome_produto: string;
  data_compra: string;
  data_validade: string;
  quantidade: number;
  imagem: string | null;
  dias_para_vencer: number;
  status: 'vencido' | 'critico' | 'atencao' | 'ok';
}

export function Estoque() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<string>('7dias');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [showAbaterModal, setShowAbaterModal] = useState(false);
  const [produtoSelecionado, setProdutoSelecionado] = useState<ProdutoEstoque | null>(null);
  const [quantidadeAbater, setQuantidadeAbater] = useState<number>(1);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [itens, setItens] = useState<any[]>([]);
  const navigate = useNavigate();

  const [novoProduto, setNovoProduto] = useState({
    item_id: null as number | null,
    nome_produto: '',
    data_compra: new Date().toISOString().split('T')[0],
    data_validade: '',
    quantidade: 1
  });

  const loadProdutos = async () => {
    try {
      setLoading(true);
      const data = await api.getEstoque(
        filtro === 'periodo' ? 'periodo' : filtro,
        filtro === 'periodo' ? dataInicio : undefined,
        filtro === 'periodo' ? dataFim : undefined
      );
      setProdutos(data);
    } catch (error) {
      console.error('Erro ao carregar estoque:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadItens = async () => {
    try {
      const data = await api.getItens();
      setItens(data);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
    }
  };

  useEffect(() => {
    loadProdutos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro, dataInicio, dataFim]);

  useEffect(() => {
    loadItens();
  }, []);

  const handleCreateProduto = async () => {
    if (!novoProduto.nome_produto || !novoProduto.data_validade || novoProduto.quantidade < 1) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await api.createEstoque(novoProduto);
      setShowModal(false);
      setNovoProduto({
        item_id: null,
        nome_produto: '',
        data_compra: new Date().toISOString().split('T')[0],
        data_validade: '',
        quantidade: 1
      });
      loadProdutos();
      alert('Produto adicionado ao estoque!');
    } catch (error) {
      console.error('Erro ao adicionar produto:', error);
      alert('Erro ao adicionar produto');
    }
  };

  const handleAbater = async () => {
    if (!produtoSelecionado) return;

    try {
      const response = await api.abaterQuantidadeEstoque(produtoSelecionado.id, quantidadeAbater);
      setShowAbaterModal(false);
      setProdutoSelecionado(null);
      setQuantidadeAbater(1);
      loadProdutos();
      
      if (response.removed) {
        alert('Produto removido do estoque (quantidade zerada)');
      } else {
        alert(`Quantidade abatida! Nova quantidade: ${response.nova_quantidade}`);
      }
    } catch (error) {
      console.error('Erro ao abater quantidade:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao abater quantidade';
      alert(errorMessage);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja remover este produto do estoque?')) return;

    try {
      await api.deleteEstoque(id);
      loadProdutos();
      alert('Produto removido do estoque');
    } catch (error) {
      console.error('Erro ao remover produto:', error);
      alert('Erro ao remover produto');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'vencido':
        return 'bg-red-700';
      case 'critico':
        return 'bg-orange-600';
      case 'atencao':
        return 'bg-yellow-600';
      default:
        return 'bg-emerald-700';
    }
  };

  const getStatusText = (produto: ProdutoEstoque) => {
    if (produto.status === 'vencido') return 'VENCIDO';
    if (produto.dias_para_vencer === 0) return 'Vence hoje!';
    if (produto.dias_para_vencer === 1) return 'Vence amanhã';
    return `${produto.dias_para_vencer} dias`;
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
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
                Controle de Produtos Perecíveis
              </h1>
              <p className="text-sm text-zinc-400">
                Gerencie produtos com data de validade
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition flex items-center gap-2"
          >
            <Plus size={18} />
            Adicionar Produto
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filtros */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">Filtrar por vencimento:</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => setFiltro('7dias')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filtro === '7dias' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Próximos 7 dias
            </button>
            <button
              onClick={() => setFiltro('semana')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filtro === 'semana' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Esta semana
            </button>
            <button
              onClick={() => setFiltro('mes')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filtro === 'mes' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Este mês
            </button>
            <button
              onClick={() => setFiltro('mes_proximo')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filtro === 'mes_proximo' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Mês que vem
            </button>
            <button
              onClick={() => setFiltro('periodo')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filtro === 'periodo' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Período personalizado
            </button>
            <button
              onClick={() => setFiltro('todos')}
              className={`px-4 py-2 rounded-lg text-sm transition ${
                filtro === 'todos' ? 'bg-emerald-700 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
              }`}
            >
              Todos
            </button>

            {filtro === 'periodo' && (
              <>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Data início"
                />
                <span className="text-zinc-500">até</span>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => setDataFim(e.target.value)}
                  className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                  placeholder="Data fim"
                />
              </>
            )}
          </div>
        </div>

        {/* Lista de Produtos */}
        {loading ? (
          <div className="text-center text-white py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-white mx-auto mb-3"></div>
            <p>Carregando estoque...</p>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center text-zinc-400 py-12 bg-zinc-900 border border-zinc-800 rounded-xl">
            <Package className="mx-auto mb-4 text-zinc-600" size={48} />
            <p className="text-lg">Nenhum produto encontrado com os filtros selecionados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition"
              >
                {/* Imagem */}
                <div className="h-48 bg-zinc-800 flex items-center justify-center">
                  {produto.imagem ? (
                    <img
                      src={produto.imagem}
                      alt={produto.nome_produto}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-zinc-600">
                      <Package size={64} />
                      <p className="text-sm mt-2">Sem imagem</p>
                    </div>
                  )}
                </div>

                {/* Conteúdo */}
                <div className="p-4">
                  <h3 className="text-white font-semibold text-lg mb-2">{produto.nome_produto}</h3>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Quantidade:</span>
                      <span className="text-white font-medium">{produto.quantidade}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Compra:</span>
                      <span className="text-white">{formatDate(produto.data_compra)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">Validade:</span>
                      <span className="text-white">{formatDate(produto.data_validade)}</span>
                    </div>
                  </div>

                  {/* Status */}
                  <div className={`${getStatusColor(produto.status)} text-white text-center py-2 rounded-lg mb-3 flex items-center justify-center gap-2`}>
                    {produto.status === 'vencido' || produto.status === 'critico' ? (
                      <AlertTriangle size={16} />
                    ) : null}
                    {getStatusText(produto)}
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setProdutoSelecionado(produto);
                        setQuantidadeAbater(1);
                        setShowAbaterModal(true);
                      }}
                      className="flex-1 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm transition flex items-center justify-center gap-2"
                    >
                      <Minus size={16} />
                      Abater
                    </button>
                    <button
                      onClick={() => handleDelete(produto.id)}
                      className="px-3 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg text-sm transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Adicionar Produto */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Adicionar Produto</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-2">Produto do catálogo (opcional)</label>
                <select
                  value={novoProduto.item_id || ''}
                  onChange={(e) => {
                    const itemId = e.target.value ? parseInt(e.target.value) : null;
                    const item = itens.find(i => i.id === itemId);
                    setNovoProduto({
                      ...novoProduto,
                      item_id: itemId,
                      nome_produto: item ? item.nome : novoProduto.nome_produto
                    });
                  }}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                >
                  <option value="">Selecione (ou digite manualmente abaixo)</option>
                  {itens.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Nome do produto *</label>
                <input
                  type="text"
                  value={novoProduto.nome_produto}
                  onChange={(e) => setNovoProduto({ ...novoProduto, nome_produto: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Morangos frescos"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Data de compra</label>
                <input
                  type="date"
                  value={novoProduto.data_compra}
                  onChange={(e) => setNovoProduto({ ...novoProduto, data_compra: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Data de validade *</label>
                <input
                  type="date"
                  value={novoProduto.data_validade}
                  onChange={(e) => setNovoProduto({ ...novoProduto, data_validade: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Quantidade *</label>
                <input
                  type="number"
                  min="1"
                  value={novoProduto.quantidade}
                  onChange={(e) => setNovoProduto({ ...novoProduto, quantidade: parseInt(e.target.value) || 1 })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t border-zinc-800">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateProduto}
                className="flex-1 px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Abater Quantidade */}
      {showAbaterModal && produtoSelecionado && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-zinc-800">
              <h2 className="text-xl font-bold text-white">Abater Quantidade</h2>
              <button
                onClick={() => setShowAbaterModal(false)}
                className="text-zinc-400 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-zinc-300 mb-4">
                Produto: <span className="font-semibold text-white">{produtoSelecionado.nome_produto}</span>
              </p>
              <p className="text-zinc-300 mb-4">
                Quantidade disponível: <span className="font-semibold text-white">{produtoSelecionado.quantidade}</span>
              </p>

              <div>
                <label className="block text-sm text-zinc-400 mb-2">Quantidade a abater</label>
                <input
                  type="number"
                  min="1"
                  max={produtoSelecionado.quantidade}
                  value={quantidadeAbater}
                  onChange={(e) => setQuantidadeAbater(parseInt(e.target.value) || 1)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {quantidadeAbater >= produtoSelecionado.quantidade && (
                <p className="text-yellow-500 text-sm mt-2">
                  ⚠️ O produto será removido do estoque ao zerar a quantidade
                </p>
              )}
            </div>

            <div className="flex gap-3 p-6 border-t border-zinc-800">
              <button
                onClick={() => setShowAbaterModal(false)}
                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleAbater}
                className="flex-1 px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
