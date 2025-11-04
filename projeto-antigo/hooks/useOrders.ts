import { useEffect, useState } from "react"
import type { OrderDetail, OrderSummary } from "../types/orders"
import { useCatalog } from "./useCatalog"
import type { Order as PanelOrder } from "../components/order-card"

export function useOrders(customDate?: string) {
  const [orders, setOrders] = useState<PanelOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { catalog } = useCatalog()

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      try {
        console.log("🕒 Buscando pedidos modificados nas últimas 8 horas...")

        const url = `${import.meta.env.VITE_CARDAPIO_API}/api/partner/v1/orders`
        const res = await fetch(url, {
          headers: { "X-API-KEY": import.meta.env.VITE_CARDAPIO_TOKEN! },
        })

        if (!res.ok) throw new Error(`Erro ${res.status}`)

        const data = await res.json()
        const allOrders: OrderSummary[] = data || []

        console.log(`📦 Recebidos ${allOrders.length} pedidos`)

        // 🔥 Mantém apenas os que não estão finalizados, cancelados ou liberados
        const activeOrders = allOrders.filter(
          (o) =>
            o.status !== "closed" &&
            o.status !== "canceled" &&
            o.status !== "waiting_to_catch" &&
            o.status !== "released"
        )
        console.log(`🧮 ${activeOrders.length} pedidos ativos para detalhar`)

        const detailedOrders: PanelOrder[] = []

        for (const order of activeOrders) {
          try {
            const detailRes = await fetch(
              `${import.meta.env.VITE_CARDAPIO_API}/api/partner/v1/orders/${order.id}`,
              { headers: { "X-API-KEY": import.meta.env.VITE_CARDAPIO_TOKEN! } }
            )
            if (!detailRes.ok) continue
            const detail: OrderDetail = await detailRes.json()

            const status = convertStatus(detail.status)
            const scheduledDateTime = detail.schedule?.scheduled_date_time_start
              ? new Date(detail.schedule.scheduled_date_time_start)
              : null
            const createdDateTime = new Date(detail.created_at)

            // Datas e horários
            const scheduledDate = scheduledDateTime?.toLocaleDateString("pt-BR") || null
            const scheduledTime =
              scheduledDateTime?.toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              }) || null
            const createdDate = createdDateTime.toLocaleDateString("pt-BR")
            const createdTime = createdDateTime.toLocaleTimeString("pt-BR", {
              hour: "2-digit",
              minute: "2-digit",
            })

            const items = detail.items.map((i) => {
              const prod = catalog.get(i.item_id)
              return {
                id: i.item_id,
                name: i.name,
                image:
                  prod?.image?.thumbnail_url ||
                  "https://placehold.co/200x200/1e1e1e/aaa?text=Sem+Imagem",
                quantity: i.quantity,
              }
            })

            const todayStr = new Date().toLocaleDateString("pt-BR")
            const isFutureSchedule =
              scheduledDate && scheduledDate !== todayStr && status === "Agendado"

            detailedOrders.push({
              id: detail.display_id,
              image:
                items[0]?.image || "https://placehold.co/200x200?text=Sem+Imagem",
              // 👇 sempre salva a data de criação real
              date: createdDate,
              time: createdTime,
              status,
              itemCount: items.length,
              customerName: detail.customer?.name || "—",
              scheduledDate: scheduledDate || undefined,
              // 👇 label exibida no card, usa data do agendamento só se for diferente de hoje
              displayDate: isFutureSchedule ? scheduledDate : createdDate,
              displayTime: isFutureSchedule
                ? scheduledTime || createdTime
                : createdTime,
              items,
            })
          } catch (err) {
            console.warn("⚠️ Erro ao buscar detalhes do pedido", order.id, err)
          }
        }

        // separa pedidos de hoje e futuros
        const todayStr = new Date().toLocaleDateString("pt-BR")
        const todayOrders = detailedOrders.filter(
          (o) => (o.scheduledDate || o.date) === todayStr
        )
        const futureOrders = detailedOrders.filter(
          (o) => (o.scheduledDate || o.date) !== todayStr
        )

        const sortByDateTime = (a: PanelOrder, b: PanelOrder) => {
          const [aDay, aMonth, aYear] = (a.scheduledDate || a.date).split("/").map(Number)
          const [bDay, bMonth, bYear] = (b.scheduledDate || b.date).split("/").map(Number)
          const [aHour, aMin] = a.time.split(":").map(Number)
          const [bHour, bMin] = b.time.split(":").map(Number)
          return (
            new Date(aYear, aMonth - 1, aDay, aHour, aMin).getTime() -
            new Date(bYear, bMonth - 1, bDay, bHour, bMin).getTime()
          )
        }

        todayOrders.sort(sortByDateTime)
        futureOrders.sort(sortByDateTime)

        const finalOrders = [...todayOrders, ...futureOrders]
        console.log(`✅ Total final: ${finalOrders.length} pedidos (hoje + agendados)`)

        setOrders(finalOrders)
      } catch (err) {
        console.error("❌ Erro no fetchOrders:", err)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
    const interval = setInterval(fetchOrders, 30_000)
    return () => clearInterval(interval)
  }, [catalog, customDate])

  return { orders, loading, error }
}

// 🔄 status adaptado
function convertStatus(apiStatus: string): PanelOrder["status"] {
  switch (apiStatus) {
    case "waiting_confirmation":
    case "pending_payment":
    case "pending_online_payment":
      return "Aguardando"
    case "confirmed":
    case "ready":
      return "Em Produção"
    case "waiting_to_catch":
      return "Esperando Retirada"
    case "released":
      return "Saiu para Entrega"
    case "closed":
      return "Finalizado"
    case "scheduled_confirmed":
      return "Agendado"
    default:
      return "Aguardando"
  }
}
