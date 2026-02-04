import { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Maximize2, Minimize2, Calendar } from 'lucide-react'
import { useOrderPolling } from '../hooks/useOrderPolling'
import { api } from '../lib/api'
import type { Pedido } from '../types'
import { useNavigate } from 'react-router-dom'

export function Painel() {
  const [pedidos, setPedidos] = useState<Pedido[]>([])
  const [loading, setLoading] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [selectedPedido, setSelectedPedido] = useState<Pedido | null>(null)
  const [zoomedImage, setZoomedImage] = useState<string | null>(null)
  const [dataSelecionada, setDataSelecionada] = useState<string>(new Date().toISOString().split('T')[0])
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [tempDate, setTempDate] = useState<string>(new Date().toISOString().split('T')[0])
  const navigate = useNavigate()

  const loadPedidos = useCallback(async () => {
    try {
      setLoading(true)
      const data = await api.getPainelProducao(dataSelecionada)
      setPedidos(data)
    } catch (error) {
      console.error('Erro ao carregar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }, [dataSelecionada])

  const handleToggleFeito = async (pedidoId: number) => {
    try {
      await api.togglePedidoFeito(pedidoId)
      // Recarrega os pedidos após atualizar
      await loadPedidos()
    } catch (error) {
      console.error('Erro ao atualizar status de produção:', error)
    }
  }

  // Polling ativo no Painel pois ele fica aberto o dia todo na produção
  // Atualiza automaticamente quando chegam novos pedidos
  useOrderPolling(loadPedidos)

  useEffect(() => {
    loadPedidos()
    const interval = setInterval(loadPedidos, 30000) // Atualiza a cada 30 segundos
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSelecionada])

  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen((v) => !v)
  }

  // Separa pedidos por período
  const manha = pedidos.filter(p => {
    const [hora] = p.horario_agendamento.split(':')
    return parseInt(hora) < 12
  })

  const tarde = pedidos.filter(p => {
    const [hora] = p.horario_agendamento.split(':')
    return parseInt(hora) >= 12
  })

  const statusColors: Record<string, string> = {
    "Em Produção": "bg-orange-500",
    "Aguardando": "bg-cyan-600",
    "Agendado": "bg-purple-600",
    "Finalizado": "bg-green-700",
    "Cancelado": "bg-red-700",
    "Saiu para Entrega": "bg-yellow-600",
    "Esperando Retirada": "bg-lime-600",
  }

  // Função recursiva para renderizar itens e sub-itens
  const renderItem = (item: any, idx: number, level: number = 0) => {
    const isSubItem = level > 0
    
    return (
      <div key={`item-${idx}-${level}`} className={isSubItem ? 'col-span-2' : ''}>
        <div className={`flex items-center gap-4 bg-[#2a2a2a] rounded-xl p-4 border ${
          isSubItem ? 'border-amber-600/40 ml-12' : 'border-gray-700'
        }`}>
          {isSubItem && <div className="text-amber-500 text-lg mr-2">↳</div>}
          <img
            src={item.imagem || 'https://placehold.co/200x200?text=Sem+Imagem'}
            alt={item.nome}
            onClick={(e) => {
              e.stopPropagation()
              setZoomedImage(item.imagem || 'https://placehold.co/200x200?text=Sem+Imagem')
            }}
            className="w-48 h-48 object-cover rounded-xl shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          />
          <div className="flex-1">
            <h3 className="text-white font-medium mb-1 text-lg">
              {isSubItem && <span className="text-amber-400 text-sm mr-2">(Adicional)</span>}
              {item.nome}
            </h3>
            <p className="text-gray-400">Quantidade: {item.quantidade}</p>
            {item.observacoes && (
              <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                <p className="text-amber-200 font-semibold text-sm mb-1">⚠️ Observações do Item:</p>
                <p className="text-amber-100 text-sm">{item.observacoes}</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Renderiza sub-itens recursivamente */}
        {item.items && item.items.length > 0 && (
          <div className="mt-2 grid grid-cols-2 gap-4">
            {item.items.map((subItem: any, subIdx: number) => 
              renderItem(subItem, subIdx, level + 1)
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading && pedidos.length === 0) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center">
        <div className="text-white text-xl">Carregando pedidos...</div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-[#111] text-white flex relative">
      <div className="flex flex-col w-16 h-full items-center justify-start p-2 gap-4">
        {/* Botão de Voltar */}
        <button
          onClick={() => navigate('/dashboard')}
          className="bg-[#222] hover:bg-[#333] hover:cursor-pointer border border-gray-700 rounded-full p-2 shadow-lg transition-colors"
        >
          <ArrowLeft />
        </button>
        
        {/* Botão Seletor de Data */}
        <div className="relative">
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="bg-[#222] hover:bg-[#333] border border-gray-700 rounded-full p-2 shadow-lg transition-colors"
            title="Selecionar data"
          >
            <Calendar />
          </button>
          
          {/* Popup do Date Picker */}
          {showDatePicker && (
            <div className="absolute left-14 top-0 bg-[#1e1e1e] border border-gray-700 rounded-lg p-4 shadow-2xl z-50 min-w-[280px]">
              <div className="mb-3">
                <p className="text-sm text-gray-400 mb-2">Selecione a data:</p>
                <input
                  type="date"
                  value={tempDate}
                  onChange={(e) => setTempDate(e.target.value)}
                  className="w-full bg-[#2a2a2a] border border-gray-600 text-white rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  style={{
                    colorScheme: 'dark'
                  }}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowDatePicker(false)
                    setTempDate(dataSelecionada)
                  }}
                  className="flex-1 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    if (tempDate && tempDate.length === 10) {
                      setDataSelecionada(tempDate)
                    }
                    setShowDatePicker(false)
                  }}
                  className="flex-1 px-3 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
                >
                  Confirmar
                </button>
              </div>
            </div>
          )}
        </div>
        
        {/* Botão de Fullscreen */}
        <button
          onClick={handleFullscreen}
          className="bg-[#222] hover:bg-[#333] border border-gray-700 rounded-full p-2 shadow-lg transition-colors"
          title={isFullscreen ? 'Sair do Fullscreen' : 'Tela cheia'}
        >
          {isFullscreen ? <Minimize2 /> : <Maximize2 />}
        </button>
      </div>

      <section className='w-full h-full grid grid-cols-1 grid-rows-2 gap-4 overflow-hidden'>
        {/* Pedidos da Manhã */}
        <div className="w-full overflow-hidden flex flex-col">
          <h2 className="text-xl font-medium text-gray-300 flex items-center gap-2 pl-1">
            🌅 Pedidos da Manhã
          </h2>

          <div className="relative overflow-visible flex-1">
            <div className="flex h-full gap-6 overflow-x-auto overflow-y-hidden scroll-smooth pt-3 px-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
              {manha.length === 0 ? (
                <div className="text-gray-500 italic">Nenhum pedido nesta seção.</div>
              ) : (
                manha.map((pedido) => (
                  <div
                    key={pedido.id}
                    onClick={() => setSelectedPedido(pedido)}
                    className="flex flex-col justify-between shrink-0 rounded-2xl p-2 bg-[#1e1e1e] border border-gray-700 shadow-sm cursor-pointer hover:scale-105 transition-transform w-72 relative"
                  >
                    {/* Badge PRODUZIDO */}
                    {pedido.is_feito && (
                      <div className="absolute top-0 -right-3 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg rotate-12 z-50">
                        ✓ PRODUZIDO
                      </div>
                    )}

                    <h3 className="text-lg font-medium mb-1">Pedido #{pedido.numero_pedido}</h3>
                    
                    {/* Imagem do primeiro item */}
                    {pedido.itens && pedido.itens.length > 0 ? (
                      <div className="relative mb-2">
                        <img
                          src={pedido.itens[0].imagem || 'https://placehold.co/200x200/1e1e1e/aaa?text=Sem+Imagem'}
                          alt={pedido.itens[0].nome}
                          className="w-full h-36 lg:h-44 object-cover rounded-lg"
                        />
                        {pedido.itens.length > 1 && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                            +{pedido.itens.length - 1} {pedido.itens.length === 2 ? 'item' : 'itens'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm mb-4 h-36 lg:h-44 flex items-center justify-center border border-gray-700 rounded-lg">
                        Sem itens cadastrados
                      </div>
                    )}

                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-2 mb-2">
                      <span className="text-blue-300 text-xs font-medium">🕐 Horário:</span>
                      <span className="text-blue-100 text-sm font-bold ml-2">{pedido.horario_agendamento}</span>
                    </div>

                    <div className={`${statusColors[pedido.status] || 'bg-gray-600'} text-white text-sm px-3 py-1 rounded-md text-center`}>
                      {pedido.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pedidos da Tarde */}
        <div className="w-full overflow-hidden flex flex-col">
          <h2 className="text-xl font-medium text-gray-300 flex items-center gap-2 pl-1">
            🌇 Pedidos da Tarde
          </h2>

          <div className="relative overflow-visible flex-1">
            <div className="flex gap-6 h-full overflow-x-auto overflow-y-hidden scroll-smooth pt-3 px-1 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full">
              {tarde.length === 0 ? (
                <div className="text-gray-500 italic">Nenhum pedido nesta seção.</div>
              ) : (
                tarde.map((pedido) => (
                  <div
                    key={pedido.id}
                    onClick={() => setSelectedPedido(pedido)}
                    className="flex flex-col justify-between shrink-0 rounded-2xl p-2 bg-[#1e1e1e] border border-gray-700 shadow-sm cursor-pointer hover:scale-105 transition-transform w-72 relative"
                  >
                    {/* Badge PRODUZIDO */}
                    {pedido.is_feito && (
                      <div className="absolute top-0 -right-3 bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg rotate-12 z-50">
                        ✓ PRODUZIDO
                      </div>
                    )}

                    <h3 className="text-lg font-medium mb-1">Pedido #{pedido.numero_pedido}</h3>
                    
                    {/* Imagem do primeiro item */}
                    {pedido.itens && pedido.itens.length > 0 ? (
                      <div className="relative mb-2">
                        <img
                          src={pedido.itens[0].imagem || 'https://placehold.co/200x200/1e1e1e/aaa?text=Sem+Imagem'}
                          alt={pedido.itens[0].nome}
                          className="w-full h-36 lg:h-44 object-cover rounded-lg"
                        />
                        {pedido.itens.length > 1 && (
                          <span className="absolute top-2 right-2 bg-red-600 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-lg">
                            +{pedido.itens.length - 1} {pedido.itens.length === 2 ? 'item' : 'itens'}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-gray-500 italic text-sm mb-4 h-36 lg:h-44 flex items-center justify-center border border-gray-700 rounded-lg">
                        Sem itens cadastrados
                      </div>
                    )}

                    <div className="bg-blue-600/20 border border-blue-500/30 rounded-lg px-3 py-2 mb-2">
                      <span className="text-blue-300 text-xs font-medium">🕐 Horário:</span>
                      <span className="text-blue-100 text-sm font-bold ml-2">{pedido.horario_agendamento}</span>
                    </div>

                    <div className={`${statusColors[pedido.status] || 'bg-gray-600'} text-white text-sm px-3 py-1 rounded-md text-center`}>
                      {pedido.status}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal de Detalhes */}
      {selectedPedido && (
        <div 
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPedido(null)}
        >
          <div 
            className="bg-[#1c1c1c] rounded-2xl shadow-2xl p-6 w-[90%] max-w-6xl max-h-[90vh] overflow-y-auto"
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
                  Data: {selectedPedido.data_agendamento.split('-').reverse().join('/')} às {selectedPedido.horario_agendamento}
                  <br />
                  Status: <span className="text-gray-200 font-medium">{selectedPedido.status}</span>
                </p>
                
                {/* Observações do Pedido */}
                {selectedPedido.observacoes && (
                  <div className="mt-4 p-3 bg-amber-900/30 border border-amber-700/50 rounded-lg">
                    <p className="text-amber-200 font-semibold text-sm mb-1">⚠️ Observações do Pedido:</p>
                    <p className="text-amber-100 text-sm">{selectedPedido.observacoes}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedPedido(null)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Renderização Recursiva de Itens */}
            <div className="grid grid-cols-2 gap-4">
              {selectedPedido.itens && selectedPedido.itens.length > 0 ? (
                selectedPedido.itens.map((item, idx) => renderItem(item, idx, 0))
              ) : (
                <div className="col-span-2 text-center text-gray-500 py-8">
                  Nenhum item cadastrado neste pedido
                </div>
              )}
            </div>

            {/* Botão para marcar como produzido */}
            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  handleToggleFeito(selectedPedido.id)
                  setSelectedPedido(null)
                }}
                className={`flex-1 py-3 rounded-lg font-semibold text-lg transition-colors ${
                  selectedPedido.is_feito
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                }`}
              >
                {selectedPedido.is_feito ? '✕ Desmarcar Produzido' : '✓ Marcar como Produzido'}
              </button>
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

      {/* Fullscreen Image Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-60 p-8"
          onClick={() => setZoomedImage(null)}
        >
          <button
            onClick={() => setZoomedImage(null)}
            className="absolute top-4 right-4 text-white bg-black/50 hover:bg-black/70 rounded-full p-3 transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={zoomedImage}
            alt="Imagem ampliada"
            className="max-w-[90vw] max-h-[90vh] min-w-[50vw] min-h-[50vh] w-auto h-auto object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
