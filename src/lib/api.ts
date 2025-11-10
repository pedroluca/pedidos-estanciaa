const API_URL = import.meta.env.VITE_API_URL || 'http://localhost/api';

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    this.baseUrl = API_URL;
    this.token = localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
      throw new Error(error.error || 'Erro na requisição');
    }

    return response.json();
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Auth
  async login(email: string, senha: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.request<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, senha }),
    });
    this.setToken(response.token);
    return response;
  }

  async register(nome: string, email: string, senha: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.request<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ nome, email, senha }),
    });
    this.setToken(response.token);
    return response;
  }

  async me() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>('/auth/me');
  }

  // Catálogo
  async syncCatalog() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>('/catalogo/sync', { method: 'POST' });
  }

  async pollOrders() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>('/pedidos/poll', { method: 'POST' });
  }

  async getCategorias() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any[]>('/catalogo/categorias');
  }

  async getItens(categoriaId?: number) {
    const query = categoriaId ? `?categoria_id=${categoriaId}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any[]>(`/catalogo/itens${query}`);
  }

  async getItem(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/catalogo/itens/${id}`);
  }

  // Pedidos
  async getPedidos(params?: { data?: string; status?: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query = new URLSearchParams(params as any).toString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any[]>(`/pedidos${query ? `?${query}` : ''}`);
  }

  async getPedido(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/pedidos/${id}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createPedido(data: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>('/pedidos', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async updatePedido(id: number, data: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/pedidos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePedido(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/pedidos/${id}`, { method: 'DELETE' });
  }

  async getPainelPedidos(data?: string) {
    const query = data ? `?data=${data}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any[]>(`/pedidos/painel${query}`);
  }

  // Produção
  async togglePedidoFeito(pedidoId: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>('/producao/toggle', {
      method: 'POST',
      body: JSON.stringify({ pedido_id: pedidoId }),
    });
  }

  async getPainelProducao(data?: string) {
    const query = data ? `?data=${data}` : '';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any[]>(`/producao/painel${query}`);
  }

  async getContabilizacao(data?: string, status?: string) {
    const params = new URLSearchParams();
    if (data) params.append('data', data);
    if (status) params.append('status', status);
    const query = params.toString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/producao/contabilizacao${query ? `?${query}` : ''}`);
  }

  // Estoque de Perecíveis
  async getEstoque(filtro?: string, dataInicio?: string, dataFim?: string) {
    const params = new URLSearchParams();
    if (filtro) params.append('filtro', filtro);
    if (dataInicio) params.append('data_inicio', dataInicio);
    if (dataFim) params.append('data_fim', dataFim);
    const query = params.toString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any[]>(`/estoque${query ? `?${query}` : ''}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async createEstoque(data: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>('/estoque', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async abaterQuantidadeEstoque(id: number, quantidade: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/estoque/${id}/abater`, {
      method: 'PUT',
      body: JSON.stringify({ quantidade }),
    });
  }

  async deleteEstoque(id: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return this.request<any>(`/estoque/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
