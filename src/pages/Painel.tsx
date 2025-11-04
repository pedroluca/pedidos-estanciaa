import { useState, useEffect } from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';
import { api } from '../lib/api';
import type { Pedido } from '../types';

export function Painel() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null);

  const loadPedidos = async () => {
    try {
      setLoading(true);
      const data = await api.getPainelPedidos();
      setPedidos(data);
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPedidos();
    const interval = setInterval(loadPedidos, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen((v) => !v);
  };

  // Separa pedidos por período
  const manha = pedidos.filter(p => {
    const [hora] = p.horario_agendamento.split(':');
    return parseInt(hora) < 12;
  });

  const tarde = pedidos.filter(p => {
    const [hora] = p.horario_agendamento.split(':');
    return parseInt(hora) >= 12;
  });

  const statusColors: Record<string, string> = {
    "Em Produção": "bg-green-600",
    "Aguardando": "bg-amber-600",
    "Agendado": "bg-purple-600",
    "Finalizado": "bg-red-700",
    "Saiu para Entrega": "bg-yellow-600",
    "Esperando Retirada": "bg-lime-600",
  };

  if (loading && pedidos.length === 0) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-white text-xl">Carregando pedidos...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111] text-white flex flex-col items-center px-6 relative">
      {/* Botão de Fullscreen */}
      <button
        onClick={handleFullscreen}
        className="absolute top-6 right-6 z-50 bg-[#222] hover:bg-[#333] border border-gray-700 rounded-full p-3 shadow-lg transition-colors"
        title={isFullscreen ? 'Sair do Fullscreen' : 'Tela cheia'}
      >
        {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>

      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-center justify-center py-8 w-full">
        <h1 className="text-3xl font-semibold text-center">
          Floricultura Estância-A - Painel de Produção
        </h1>
      </div>

      {/* Pedidos da Manhã */}
      <div className="w-full mb-10">
        <h2 className="text-2xl font-medium text-gray-300 mb-6 flex items-center gap-2 pl-1">
          🌅 Pedidos da Manhã ({manha.length})
        </h2>
        <div className="flex gap-6 overflow-x-auto scroll-smooth pb-4 px-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
          {manha.length === 0 ? (
            <div className="text-gray-500 italic">Nenhum pedido para a manhã.</div>
          ) : (
            manha.map((pedido) => (
              <div
                key={pedido.id}
                onClick={() => setSelectedPedido(pedido)}
                className="shrink-0 rounded-2xl p-6 bg-[#1e1e1e] border border-gray-700 shadow-sm cursor-pointer hover:scale-105 transition-transform w-72"
              >
                <h3 className="text-lg font-medium mb-3">Pedido #{pedido.numero_pedido}</h3>
                
                {/* Imagens dos itens */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {pedido.itens.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={item.imagem || 'https://placehold.co/200x200/1e1e1e/aaa?text=Sem+Imagem'}
                        alt={item.nome}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {item.quantidade > 1 && (
                        <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          x{item.quantidade}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {pedido.itens.length > 4 && (
                  <div className="text-sm text-gray-400 mb-3">
                    +{pedido.itens.length - 4} item(s) a mais
                  </div>
                )}

                <div className="text-gray-400 text-sm mb-2">
                  Horário: {pedido.horario_agendamento}
                </div>

                <div className={`${statusColors[pedido.status] || 'bg-gray-600'} text-white text-sm px-3 py-1 rounded-md text-center`}>
                  {pedido.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Pedidos da Tarde */}
      <div className="w-full mb-10">
        <h2 className="text-2xl font-medium text-gray-300 mb-6 flex items-center gap-2 pl-1">
          🌇 Pedidos da Tarde ({tarde.length})
        </h2>
        <div className="flex gap-6 overflow-x-auto scroll-smooth pb-4 px-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
          {tarde.length === 0 ? (
            <div className="text-gray-500 italic">Nenhum pedido para a tarde.</div>
          ) : (
            tarde.map((pedido) => (
              <div
                key={pedido.id}
                onClick={() => setSelectedPedido(pedido)}
                className="shrink-0 rounded-2xl p-6 bg-[#1e1e1e] border border-gray-700 shadow-sm cursor-pointer hover:scale-105 transition-transform w-72"
              >
                <h3 className="text-lg font-medium mb-3">Pedido #{pedido.numero_pedido}</h3>
                
                {/* Imagens dos itens */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {pedido.itens.slice(0, 4).map((item, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={item.imagem || 'https://placehold.co/200x200/1e1e1e/aaa?text=Sem+Imagem'}
                        alt={item.nome}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      {item.quantidade > 1 && (
                        <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                          x{item.quantidade}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {pedido.itens.length > 4 && (
                  <div className="text-sm text-gray-400 mb-3">
                    +{pedido.itens.length - 4} item(s) a mais
                  </div>
                )}

                <div className="text-gray-400 text-sm mb-2">
                  Horário: {pedido.horario_agendamento}
                </div>

                <div className={`${statusColors[pedido.status] || 'bg-gray-600'} text-white text-sm px-3 py-1 rounded-md text-center`}>
                  {pedido.status}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal de Detalhes */}
      {selectedPedido && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPedido(null)}
        >
          <div 
            className="bg-[#1c1c1c] rounded-2xl shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-white mb-2">
                  Pedido #{selectedPedido.numero_pedido}
                </h2>
                <p className="text-sm text-gray-400">
                  Cliente: <span className="text-gray-200">{selectedPedido.nome_cliente}</span>
                  <br />
                  Data: {new Date(selectedPedido.data_agendamento).toLocaleDateString('pt-BR')} às {selectedPedido.horario_agendamento}
                  <br />
                  Status: <span className="text-gray-200 font-medium">{selectedPedido.status}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedPedido(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {selectedPedido.itens.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-[#2a2a2a] rounded-xl p-4 border border-gray-700">
                  <img
                    src={item.imagem || 'https://placehold.co/200x200?text=Sem+Imagem'}
                    alt={item.nome}
                    className="w-32 h-32 object-cover rounded-xl"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{item.nome}</h3>
                    <p className="text-gray-400 text-sm">Quantidade: {item.quantidade}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-white mx-auto mb-3"></div>
            <p className="text-gray-200 text-lg font-medium">Atualizando pedidos...</p>
          </div>
        </div>
      )}
    </div>
  );
}
