export interface CatalogResponse {
  categories: CatalogCategory[]
}

export interface CatalogCategory {
  id: number
  name: string
  description: string
  index: number
  status: "ACTIVE" | "INACTIVE"
  image: string | null
  allowed_times: AllowedTime[]
  items: CatalogItem[]
}

export interface AllowedTime {
  weekday: string
  start_at: string
  end_at: string
}

export interface CatalogItem {
  id: number
  name: string
  description: string
  image: CatalogImage | null
  highlighted: boolean
  external_code: string
  price: number
  stock: number
  active_stock_control: boolean
  index: number | null
  available_for: string[]
  hide_observation_field: boolean
  adults_only: boolean
  promotional_price_active: boolean
  promotional_price: number | null
  promotional_price_availability: string[]
  status: "ACTIVE" | "INACTIVE" | "MISSING"
  unit_type: string
  kind: string
  allowed_times: AllowedTime[]
  extra_images: CatalogImage[]
  option_groups: OptionGroup[]
}

export interface CatalogImage {
  image_url: string
  thumbnail_url: string
}

export interface OptionGroup {
  id: number
  name: string
  status: "ACTIVE" | "INACTIVE"
  choice_type: "SINGLE" | "MULTIPLE"
  price_calculation_type: "SUM" | "MIN" | "MAX"
  available_for: string[]
  minimum_quantity: number
  maximum_quantity: number
  index: number
  options: Option[]
}

export interface Option {
  id: number
  name: string
  description: string | null
  external_code: string | null
  status: string
  stock: number
  active_stock_control: boolean
  image: string | null
  index: number
  max_quantity: number | null
  price: number
}
