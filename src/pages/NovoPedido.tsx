import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Categoria, Item } from '../types';

interface ItemPedido {
  item_id: number;
  nome: string;
  quantidade: number;
  preco_unitario: number;
  observacoes?: string;
}

export function NovoPedido() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [itens, setItens] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [numeroPedido, setNumeroPedido] = useState('');
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefoneCliente, setTelefoneCliente] = useState('');
  const [dataAgendamento, setDataAgendamento] = useState('');
  const [horarioAgendamento, setHorarioAgendamento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);

  useEffect(() => {
    loadCatalogo();
    // Define data e hora atuais como padrão
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].substring(0, 5);
    setDataAgendamento(dateStr);
    setHorarioAgendamento(timeStr);
  }, []);

  const loadCatalogo = async () => {
    try {
      setLoading(true);
      const [cats, its] = await Promise.all([
        api.getCategorias(),
        api.getItens()
      ]);
      setCategorias(cats);
      setItens(its);
    } catch (error) {
      console.error('Erro ao carregar catálogo:', error);
      alert('Erro ao carregar catálogo');
    } finally {
      setLoading(false);
    }
  };

  const adicionarItem = (item: Item) => {
    const existe = itensPedido.find(i => i.item_id === item.id);
    
    // Garante que o preço é um número válido
    const precoPromocional = Number(item.preco_promocional) || 0;
    const precoNormal = Number(item.preco) || 0;
    const precoFinal = item.preco_promocional_ativo && precoPromocional > 0 
      ? precoPromocional 
      : precoNormal;
    
    if (existe) {
      setItensPedido(itensPedido.map(i => 
        i.item_id === item.id 
          ? { ...i, quantidade: i.quantidade + 1 }
          : i
      ));
    } else {
      setItensPedido([...itensPedido, {
        item_id: item.id,
        nome: item.nome,
        quantidade: 1,
        preco_unitario: precoFinal
      }]);
    }
  };

  const removerItem = (item_id: number) => {
    setItensPedido(itensPedido.filter(i => i.item_id !== item_id));
  };

  const alterarQuantidade = (item_id: number, quantidade: number) => {
    if (quantidade <= 0) {
      removerItem(item_id);
      return;
    }
    setItensPedido(itensPedido.map(i => 
      i.item_id === item_id ? { ...i, quantidade } : i
    ));
  };

  const calcularTotal = () => {
    return itensPedido.reduce((sum, item) => 
      sum + (item.preco_unitario * item.quantidade), 0
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!numeroPedido || !nomeCliente || !dataAgendamento || !horarioAgendamento) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    if (itensPedido.length === 0) {
      alert('Adicione pelo menos um item ao pedido');
      return;
    }

    try {
      await api.createPedido({
        numero_pedido: numeroPedido,
        nome_cliente: nomeCliente,
        telefone_cliente: telefoneCliente,
        data_agendamento: dataAgendamento,
        horario_agendamento: horarioAgendamento,
        tipo_entrega: 'DELIVERY',
        status: 'Agendado',
        endereco_entrega: '',
        observacoes,
        itens: itensPedido.map(i => ({
          item_id: i.item_id,
          quantidade: i.quantidade,
          preco_unitario: i.preco_unitario,
          observacoes: i.observacoes
        }))
      });

      alert('Pedido criado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      alert('Erro ao criar pedido: ' + message);
    }
  };

  const itensFiltrados = selectedCategoria 
    ? itens.filter(i => i.categoria_id === selectedCategoria && i.ativo)
    : itens.filter(i => i.ativo);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Carregando catálogo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Cadastro Manual de Pedido</h1>
        <p className="text-gray-600 mb-6">
          Use este formulário para cadastrar pedidos que ficaram de fora do período de 8 horas do polling automático.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Formulário */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Código do Pedido * <span className="text-xs text-gray-500">(ex: 149673452)</span>
                  </label>
                  <input
                    type="text"
                    value={numeroPedido}
                    onChange={(e) => setNumeroPedido(e.target.value)}
                    placeholder="149673452"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Cliente *
                  </label>
                  <input
                    type="text"
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone
                  </label>
                  <input
                    type="tel"
                    value={telefoneCliente}
                    onChange={(e) => setTelefoneCliente(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Agendamento *
                  </label>
                  <input
                    type="date"
                    value={dataAgendamento}
                    onChange={(e) => setDataAgendamento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário *
                  </label>
                  <input
                    type="time"
                    value={horarioAgendamento}
                    onChange={(e) => setHorarioAgendamento(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observações
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="Informações adicionais sobre o pedido..."
                />
              </div>

              {/* Catálogo de Itens */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Selecionar Itens</h3>
                
                {/* Filtro por Categoria */}
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCategoria(null)}
                    className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                      selectedCategoria === null
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    Todas
                  </button>
                  {categorias.filter(c => c.ativo).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategoria(cat.id)}
                      className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap ${
                        selectedCategoria === cat.id
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {cat.nome}
                    </button>
                  ))}
                </div>

                {/* Grid de Itens */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {itensFiltrados.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => adicionarItem(item)}
                      className="flex flex-col items-center p-3 border border-gray-300 rounded-lg hover:border-green-500 hover:shadow-md transition-all"
                    >
                      {item.imagem && (
                        <img
                          src={item.imagem}
                          alt={item.nome}
                          className="w-full h-24 object-cover rounded mb-2"
                        />
                      )}
                      <p className="text-sm font-medium text-gray-900 text-center line-clamp-2">
                        {item.nome}
                      </p>
                      <p className="text-sm text-green-600 font-semibold mt-1">
                        R$ {(() => {
                          const preco = item.preco_promocional_ativo && item.preco_promocional 
                            ? Number(item.preco_promocional) 
                            : Number(item.preco);
                          return (preco || 0).toFixed(2);
                        })()}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2"
                >
                  <Plus size={20} />
                  Criar Pedido
                </button>
              </div>
            </form>
          </div>

          {/* Resumo do Pedido */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Itens do Pedido</h3>
              
              {itensPedido.length === 0 ? (
                <p className="text-gray-500 text-sm">Nenhum item adicionado</p>
              ) : (
                <div className="space-y-3">
                  {itensPedido.map((item) => (
                    <div key={item.item_id} className="flex items-center justify-between gap-2 pb-3 border-b">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.nome}</p>
                        <p className="text-xs text-gray-500">
                          R$ {(Number(item.preco_unitario) || 0).toFixed(2)} x {item.quantidade}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantidade}
                          onChange={(e) => alterarQuantidade(item.item_id, parseInt(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => removerItem(item.item_id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="pt-3 border-t-2 border-gray-300">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-900">Total:</span>
                      <span className="text-xl font-bold text-green-600">
                        R$ {(calcularTotal() || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
