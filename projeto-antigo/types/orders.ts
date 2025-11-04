export interface OrderSummary {
  id: number
  status: string
  order_type: string
  order_timing: string
  sales_channel: string
  created_at: string
  updated_at: string
}

export interface Schedule {
  scheduled_date_time_start: string
  scheduled_date_time_end: string
}

export interface OrderDetail {
  id: number
  display_id: number
  status: string
  order_type: string
  order_timing: string
  sales_channel: string
  delivered_by: string
  estimated_time: number
  total: number
  created_at: string
  updated_at: string
  customer: Customer
  delivery_address: DeliveryAddress
  items: OrderItem[]
  schedule: Schedule
}

export interface Customer {
  id: number
  phone: string
  name: string
}

export interface DeliveryAddress {
  street: string
  number: string
  neighborhood: string
  city: string
  state: string
}

export interface OrderItem {
  item_id: number
  order_item_id: number
  name: string
  quantity: number
  unit_price: number
  total_price: number
  kind: string
  status: string
}
