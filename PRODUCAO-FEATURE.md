# Funcionalidade: Marcação de Produção e Filtro por Data

## Data: 2025-11-05

## Alterações Implementadas

### 1. Banco de Dados

**Nova coluna na tabela `pedidos`:**
- `is_feito` (TINYINT 0/1): Indica se o pedido já foi produzido
- Script de migração: `api/database/migration_add_is_feito.sql`

**Comando SQL para aplicar:**
```sql
ALTER TABLE pedidos 
ADD COLUMN is_feito TINYINT(1) DEFAULT 0 AFTER valor_total,
ADD INDEX idx_is_feito (is_feito);
```

### 2. Backend (API PHP)

**Novo Controller:**
- `api/controllers/ProducaoController.php`
  - `toggleFeito()`: Marca/desmarca pedido como produzido
  - `getPainelProducao()`: Retorna pedidos filtrados por data

**Novas Rotas:**
- `POST /api/producao/toggle` - Toggle status de produção
  - Body: `{ "pedido_id": 123 }`
  - Retorna: `{ "pedido_id": 123, "is_feito": true }`

- `GET /api/producao/painel?data=2025-11-05` - Lista pedidos por data
  - Query: `data` (opcional, padrão: hoje)
  - Retorna: Array de pedidos com `is_feito` boolean

### 3. Frontend (React)

**Painel de Produção (`src/pages/Painel.tsx`):**

**Funcionalidades Adicionadas:**

1. **Filtro por Data:**
   - Input de data no cabeçalho
   - Permite selecionar qualquer dia (hoje, amanhã, etc.)
   - Atualiza automaticamente os pedidos ao trocar a data

2. **Badge "PRODUZIDO":**
   - Aparece no canto superior direito do card
   - Cor verde com rotação de 12°
   - Visual destacado: "✓ PRODUZIDO"

3. **Botão de Marcação:**
   - "Marcar como Produzido" (verde) quando não está marcado
   - "Desmarcar Produzido" (cinza) quando já está marcado
   - Atualiza instantaneamente após o clique
   - Não interfere no modal de detalhes (click separado)

**Alterações de Layout:**
- Uma imagem grande por pedido (em vez de grid 2x2)
- Badge vermelha com contador de itens adicionais (+2 itens)
- Cabeçalho com seletor de data ao lado do título

### 4. Types TypeScript

**Atualizado `src/types/index.ts`:**
```typescript
export interface Pedido {
  // ... campos existentes
  is_feito: boolean;  // NOVO CAMPO
}
```

### 5. API Client

**Atualizado `src/lib/api.ts`:**
```typescript
async togglePedidoFeito(pedidoId: number)
async getPainelProducao(data?: string)
```

## Como Usar

### No Painel de Produção:

1. **Filtrar por Data:**
   - Clique no campo de data no cabeçalho
   - Selecione a data desejada
   - Os pedidos serão carregados automaticamente

2. **Marcar como Produzido:**
   - Clique no botão verde "Marcar como Produzido"
   - O card receberá uma badge "✓ PRODUZIDO" no canto
   - O botão muda para cinza "Desmarcar Produzido"

3. **Ver Detalhes:**
   - Clique na área da imagem ou informações do pedido
   - Abre o modal com todos os itens

## Fluxo de Trabalho Sugerido

1. Funcionárias acessam o painel no tablet
2. Visualizam os pedidos do dia (ou selecionam outra data)
3. Ao terminar a produção de um pedido, clicam em "Marcar como Produzido"
4. Pedidos marcados ficam visualmente diferenciados
5. Ao final do dia, é fácil identificar quais pedidos foram produzidos

## Benefícios

- ✅ Controle visual de produção
- ✅ Não depende do status da API externa
- ✅ Permite planejamento antecipado (ver pedidos futuros)
- ✅ Interface intuitiva e rápida
- ✅ Dados persistidos no banco local

## Próximas Melhorias Possíveis

- [ ] Filtro adicional: "Mostrar apenas não produzidos"
- [ ] Estatísticas: X de Y pedidos produzidos
- [ ] Histórico de quem marcou como produzido e quando
- [ ] Notificação quando um novo pedido entra para hoje
