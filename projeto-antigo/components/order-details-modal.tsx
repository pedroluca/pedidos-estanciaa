import { X } from "lucide-react"
import type { Order } from "./order-card"

interface Props {
  order: Order | null
  onClose: () => void
}

export function OrderDetailsModal({ order, onClose }: Props) {
  if (!order) return null

  const { customerName, date, time, status, scheduledDate, items } = order

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-[#1c1c1c] rounded-2xl shadow-2xl p-6 w-[80%] max-w-6xl relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X size={22} />
        </button>

        <h2 className="text-xl font-semibold text-white mb-2">
          Pedido #{order.id}
        </h2>

        <p className="text-sm text-gray-400 mb-4">
          Cliente: <span className="text-gray-200">{customerName || "—"}</span>
          <br />
          Feito em: {date} às {time}
          {scheduledDate && (
            <>
              <br />
              Agendado para:{" "}
              <span className="text-gray-200">{scheduledDate}</span>
            </>
          )}
          <br />
          Status:{" "}
          <span className="text-gray-200 font-medium">{status}</span>
        </p>

        <div className="max-h-[60vh] overflow-y-auto pr-2 grid grid-cols-2 gap-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 bg-[#2a2a2a] rounded-xl p-3 border border-gray-700"
            >
              <img
                src={item.image}
                alt={item.name}
                className="w-48 h-4w-48 object-cover rounded-xl"
              />

              <div className="flex-1">
                <h3 className="text-white font-medium">{item.name}</h3>
                <p className="text-gray-400 text-sm">
                  Quantidade: {item.quantity}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
