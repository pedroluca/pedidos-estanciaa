export interface User {
  id: number;
  nome: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao: string;
  imagem: string | null;
  ativo: boolean;
  indice: number;
}

export interface Item {
  id: number;
  categoria_id: number;
  nome: string;
  descricao: string;
  imagem: string | null;
  preco: number;
  preco_promocional: number | null;
  preco_promocional_ativo: boolean;
  tipo_unidade: string;
  status: string;
  ativo: boolean;
}

export interface ItemPedido {
  item_id: number;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  observacoes?: string;
  nome?: string;
  imagem?: string;
}

export interface Pedido {
  id: number;
  numero_pedido: string;
  nome_cliente: string;
  telefone_cliente: string | null;
  data_criacao: string;
  data_agendamento: string;
  horario_agendamento: string;
  status: 'Aguardando' | 'Em Produção' | 'Agendado' | 'Saiu para Entrega' | 'Esperando Retirada' | 'Finalizado';
  tipo_entrega: 'DELIVERY' | 'RETIRADA';
  endereco_entrega: string | null;
  observacoes: string | null;
  valor_total: number;
  is_feito: boolean;
  itens: ItemPedido[];
}

export interface CreatePedido {
  numero_pedido: string;
  nome_cliente: string;
  telefone_cliente?: string;
  data_agendamento: string;
  horario_agendamento: string;
  status?: string;
  tipo_entrega?: string;
  endereco_entrega?: string;
  observacoes?: string;
  itens: {
    item_id: number;
    quantidade: number;
    preco_unitario: number;
    observacoes?: string;
  }[];
}
