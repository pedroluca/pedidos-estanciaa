# Proteção de Edição Manual de Pedidos

## Visão Geral

Este documento descreve a implementação do sistema de proteção de edições manuais contra sobrescrita do polling automático.

## Problema

O sistema faz polling da API do Cardápio Web a cada 5 minutos para sincronizar pedidos. Antes desta implementação, se um pedido fosse editado manualmente no Dashboard, as alterações seriam sobrescritas na próxima execução do polling.

## Solução

Implementamos um campo `editado_manualmente` na tabela `pedidos` que funciona como uma flag de proteção:

- Quando um pedido é editado manualmente no Dashboard, este campo é marcado como `1`
- O polling verifica esta flag antes de atualizar um pedido
- Se `editado_manualmente = 1`, o polling **pula** aquele pedido, preservando as alterações manuais

## Mudanças no Banco de Dados

### Nova Coluna

```sql
editado_manualmente TINYINT(1) DEFAULT 0
```

- **Default**: 0 (não editado manualmente)
- **Indexado**: Para melhor performance nas queries do polling
- **Localização**: Logo após o campo `is_feito`

### Migration

Arquivo: `api/database/migration_add_editado_manualmente.sql`

```sql
ALTER TABLE pedidos 
ADD COLUMN editado_manualmente TINYINT(1) DEFAULT 0 AFTER is_feito,
ADD INDEX idx_editado_manualmente (editado_manualmente);
```

**⚠️ IMPORTANTE**: Esta migration deve ser executada no servidor de produção antes de fazer deploy dos arquivos PHP atualizados.

## Mudanças no Backend

### 1. PollingController.php

**Localização**: `api/controllers/PollingController.php`

Modificado o método `pollOrders()` para:

1. Buscar também o campo `editado_manualmente` ao verificar pedidos existentes:
```php
$stmt = $this->db->prepare('SELECT id, status, editado_manualmente FROM pedidos WHERE numero_pedido = ?');
```

2. Pular atualização se o pedido foi editado manualmente:
```php
if ($existing['editado_manualmente'] == 1) {
    continue; // Pula este pedido
}
```

### 2. PedidosController.php

**Localização**: `api/controllers/PedidosController.php`

Modificado o método `update($id)` para marcar automaticamente como editado:

```php
// Marca como editado manualmente para proteger do polling
$fields[] = 'editado_manualmente = 1';
```

Sempre que um pedido é atualizado através da rota `PUT /api/pedidos/{id}`, a flag é automaticamente definida como `1`.

## Mudanças no Frontend

### 1. Tipos TypeScript

**Localização**: `src/types/index.ts`

Adicionado campo à interface `Pedido`:

```typescript
export interface Pedido {
  // ... outros campos
  editado_manualmente: boolean;
}
```

### 2. Dashboard - Interface de Edição

**Localização**: `src/pages/Dashboard.tsx`

Adicionado sistema completo de edição no modal de detalhes:

#### Estados Adicionados:
- `isEditing`: Controla se está em modo de edição
- `editData`: Armazena os dados sendo editados
- `saveLoading`: Indica carregamento durante salvamento

#### Campos Editáveis:
1. **Data Agendada** (`data_agendamento`)
   - Input tipo `date`
   - Formato: YYYY-MM-DD

2. **Horário** (`horario_agendamento`)
   - Input tipo `time`
   - Formato: HH:MM

3. **Observações** (`observacoes`)
   - Textarea
   - Permite adicionar ou editar observações do pedido

#### Botões:
- **Editar**: Entra no modo de edição
- **Salvar**: Envia as alterações para o backend
- **Cancelar**: Descarta alterações e volta ao modo visualização

### 3. API Client

**Localização**: `src/lib/api.ts`

A função `updatePedido()` já existia e não precisou ser modificada:

```typescript
async updatePedido(id: number, data: any) {
  return this.request<any>(`/pedidos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}
```

## Fluxo de Funcionamento

### Edição Manual

1. Admin abre o Dashboard
2. Clica em um pedido para ver detalhes
3. Clica no botão "Editar"
4. Modifica data, horário e/ou observações
5. Clica em "Salvar"
6. Backend marca `editado_manualmente = 1`
7. Pedido está protegido contra polling

### Proteção no Polling

1. Cron executa polling a cada 5 minutos
2. Para cada pedido da API:
   - Verifica se existe no banco
   - Verifica se `editado_manualmente = 1`
   - Se marcado: **pula** atualização
   - Se não marcado: atualiza normalmente

## Deploy

### Ordem de Deployment (IMPORTANTE)

1. **Primeiro**: Execute a migration no servidor
   ```bash
   mysql -u usuario -p database < api/database/migration_add_editado_manualmente.sql
   ```

2. **Segundo**: Faça upload dos arquivos PHP
   - `api/controllers/PollingController.php`
   - `api/controllers/PedidosController.php`
   - `api/database/schema.sql` (atualizado)

3. **Terceiro**: Faça upload do frontend
   - Pasta `dist/` completa

### Verificação

Após deploy:

1. Edite um pedido no Dashboard
2. Verifique no banco que `editado_manualmente = 1`
3. Aguarde o próximo polling (5 minutos)
4. Verifique que as alterações manuais permaneceram

## Considerações

### Quando Resetar a Flag?

Atualmente, uma vez marcado como `editado_manualmente = 1`, o pedido nunca mais será atualizado pelo polling. 

**Possíveis melhorias futuras**:

1. **Reset Automático**: Quando o status do pedido mudar para "Finalizado"
2. **Reset Manual**: Botão no Dashboard para "Desproteger" um pedido
3. **Atualização Seletiva**: Polling só atualiza status, mas não data/horário/observações

### Performance

- A query do polling ficou um pouco mais pesada (busca mais um campo)
- Criamos um índice para otimizar: `idx_editado_manualmente`
- Impacto mínimo esperado

### Segurança

- Apenas usuários autenticados podem editar pedidos
- A API valida o token JWT antes de permitir edição
- O campo é automaticamente marcado, sem possibilidade de fraude

## Testes Recomendados

### Cenário 1: Edição Protege do Polling
1. Criar pedido novo via polling
2. Editar manualmente no Dashboard
3. Aguardar próximo polling
4. Verificar que mudanças permaneceram

### Cenário 2: Pedido Não Editado Continua Atualizando
1. Criar pedido via polling
2. NÃO editar manualmente
3. Mudar status na API do Cardápio Web
4. Aguardar polling
5. Verificar que status foi atualizado

### Cenário 3: Múltiplas Edições
1. Editar pedido várias vezes
2. Verificar que flag continua como 1
3. Verificar que polling continua pulando

## Arquivos Modificados

### Backend PHP
- `api/controllers/PollingController.php` - Adiciona verificação da flag
- `api/controllers/PedidosController.php` - Define flag ao atualizar
- `api/database/schema.sql` - Adiciona coluna ao schema
- `api/database/migration_add_editado_manualmente.sql` - **NOVO ARQUIVO**

### Frontend TypeScript/React
- `src/types/index.ts` - Adiciona campo à interface
- `src/pages/Dashboard.tsx` - Interface de edição completa
- `src/lib/api.ts` - Sem alterações (método já existia)

## Conclusão

Esta implementação garante que edições manuais feitas no Dashboard sejam preservadas, evitando que o polling automático sobrescreva mudanças importantes feitas pela equipe da floricultura.

O sistema é robusto, com flag automática e verificação em todas as execuções do polling.
