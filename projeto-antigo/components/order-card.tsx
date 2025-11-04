export interface Order {
  id: number
  image: string
  date: string // data de criação real
  time: string // hora de criação real
  displayDate?: string // data que aparece no card (pode ser a do agendamento)
  displayTime?: string // hora que aparece no card (pode ser a do agendamento)
  status:
    | "Em Produção"
    | "Aguardando"
    | "Finalizado"
    | "Agendado"
    | "Saiu para Entrega"
    | "Esperando Retirada"
    | "Teste"
  itemCount: number
  customerName?: string
  scheduledDate?: string
  items: {
    id: number
    name: string
    image: string
    quantity: number
  }[]
}

interface Props extends Order {
  size?: "small" | "large"
}

const statusColors: Record<Order["status"], string> = {
  "Em Produção": "bg-green-600",
  "Aguardando": "bg-amber-800",
  "Finalizado": "bg-red-700",
  "Agendado": "bg-purple-600",
  "Saiu para Entrega": "bg-yellow-600",
  "Esperando Retirada": "bg-lime-600",
  "Teste": "bg-gray-600",
}

export function OrderCard({
  id,
  image,
  date,
  time,
  displayDate,
  displayTime,
  status,
  scheduledDate,
  size = "small",
  itemCount,
}: Props) {
  const imageSize = size === "large" ? "w-40 h-40" : "w-28 h-28"
  const fontSize = size === "large" ? "text-base" : "text-sm"

  // 🔍 Detecta se é um pedido agendado para outro dia
  const todayStr = new Date().toLocaleDateString("pt-BR")
  const isFutureScheduled =
    status === "Agendado" && scheduledDate && scheduledDate !== todayStr

  return (
    <div
      className={`rounded-2xl p-4 flex flex-col items-center border shadow-sm relative cursor-pointer hover:scale-105 transition-transform
        ${isFutureScheduled
          ? "border-blue-500/60 shadow-blue-500/20 hover:shadow-blue-500/30"
          : "border-gray-700"
        } bg-[#1e1e1e]`}
    >
      <h2 className={`text-gray-200 ${fontSize} font-medium mb-2`}>
        Pedido #{id}
      </h2>

      <div className="relative mb-3">
        <img
          src={image}
          alt={`Pedido ${id}`}
          className={`${imageSize} object-cover rounded-lg`}
        />
        {itemCount > 1 && (
          <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full shadow-lg border border-red-400">
            +{itemCount}
          </span>
        )}
      </div>

      {/* Data exibida: se for agendado pra outro dia, mostra a do agendamento */}
      <div className="text-gray-400 text-xs mb-1 text-center">
        {isFutureScheduled && displayDate
          ? `${displayDate} ${displayTime || ""}`
          : `${date} ${time}`}
      </div>

      <div
        className={`${statusColors[status]} text-white text-xs px-3 py-1 rounded-md mt-1`}
      >
        {status}
      </div>

      {/* Selo discreto de “Agendado Futuro” */}
      {isFutureScheduled && (
        <span className="absolute top-2 left-2 text-[10px] text-blue-400 uppercase font-semibold">
          amanhã
        </span>
      )}
    </div>
  )
}
