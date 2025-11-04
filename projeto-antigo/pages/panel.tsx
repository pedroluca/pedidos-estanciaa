import { useState } from "react"
import { OrderCard, type Order } from "../components/order-card"
import { OrderDetailsModal } from "../components/order-details-modal"
import { useOrders } from "../hooks/useOrders"
import { Maximize2, Minimize2 } from "lucide-react"

export function Panel() {
  const { orders, loading } = useOrders()
  const [selected, setSelected] = useState<Order | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Função para alternar o modo fullscreen
  const handleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setIsFullscreen((v) => !v)
  }

  if (!orders.length && loading)
    return <div className="text-gray-400 text-center mt-10">Carregando pedidos...</div>
  // if (error)
  //   return <div className="text-red-400 text-center mt-10">Erro: {error}</div>

  const morning = orders.filter((o) => parseInt(o.time.split(":")[0]) < 12)
  const afternoon = orders.filter((o) => parseInt(o.time.split(":")[0]) >= 12)

  const sections = [
    { title: "🌅 Pedidos da Manhã", list: morning },
    { title: "🌇 Pedidos da Tarde", list: afternoon },
  ]

  return (
    <div className="h-screen bg-[#111] text-white flex flex-col items-center px-6 relative">
      {/* Botão de Fullscreen */}
      <button
        onClick={handleFullscreen}
        className="absolute top-6 right-6 z-50 bg-[#222] hover:bg-[#333] border border-gray-700 rounded-full p-3 shadow-lg transition-colors"
        title={isFullscreen ? "Sair do Fullscreen" : "Tela cheia"}
      >
        {isFullscreen ? <Minimize2 size={24} /> : <Maximize2 size={24} />}
      </button>
      
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-center justify-center h-[10%] w-full">
        <h1 className="text-3xl font-semibold text-center sm:text-left mb-4 sm:mb-0">
          Floricultura Estância-A - Painel de Produção
        </h1>
      </div>

      {/* Linhas de pedidos */}
      {sections.map(({ title, list }) => (
        <div key={title} className="w-full h-[45%]">
          <h2 className="text-xl font-medium text-gray-300 mb-4 flex items-center gap-2 pl-1">
            {title}
          </h2>

          <div className="relative">
            <div
              className="
                flex gap-6 overflow-x-auto scroll-smooth pb-4 px-1
                [&::-webkit-scrollbar]:h-2
                [&::-webkit-scrollbar-thumb]:bg-gray-600
                [&::-webkit-scrollbar-thumb]:rounded-full
              "
            >
              {list.map((o) => (
                <div key={o.id} onClick={() => setSelected(o)} className="shrink-0">
                  <OrderCard {...o} size="large" />
                </div>
              ))}
              {list.length === 0 && (
                <div className="text-gray-500 italic">Nenhum pedido nesta seção.</div>
              )}
            </div>
          </div>
        </div>
      ))}

      <OrderDetailsModal order={selected} onClose={() => setSelected(null)} />
      {loading && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent border-white mx-auto mb-3"></div>
            <p className="text-gray-200 text-lg font-medium">Atualizando pedidos...</p>
          </div>
        </div>
      )}
    </div>
  )
}
