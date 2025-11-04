import { useEffect, useState } from "react"
import type { CatalogResponse, CatalogItem } from "../types/catalog"

export function useCatalog() {
  const [catalog, setCatalog] = useState<Map<number, CatalogItem>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_CARDAPIO_API}/api/partner/v1/catalog`, {
          headers: {
            "X-API-KEY": import.meta.env.VITE_CARDAPIO_TOKEN!,
          },
        })
        if (!res.ok) throw new Error(`Erro ${res.status}`)
        const data: CatalogResponse = await res.json()

        const map = new Map<number, CatalogItem>()
        data.categories.forEach((c) =>
          c.items.forEach((i) => map.set(i.id, i))
        )

        setCatalog(map)
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message)
        } else {
          setError(String(err))
        }
      } finally {
        setLoading(false)
      }
    }

    fetchCatalog()
  }, [])

  return { catalog, loading, error }
}
