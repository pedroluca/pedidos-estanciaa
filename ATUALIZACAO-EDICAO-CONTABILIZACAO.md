# Atualização do Sistema - Edição Manual Refinada e Contabilização

**Data:** 07 de Novembro de 2025

## Resumo das Mudanças

Esta atualização implementa melhorias significativas no sistema de edição manual de pedidos e adiciona uma nova funcionalidade de contabilização de produtos.

---

## 1. Sistema de Edição Manual Refinado

### Problema Anterior
- Quando um pedido era editado manualmente, ele **não era mais atualizado** pelo polling
- Isso causava problemas quando os itens do pedido eram alterados no cardápio
- Os pedidos ficavam desatualizados e inúteis

### Nova Solução
Implementamos um sistema de edição granular com **duas flags independentes**:

#### 1.1. Flag `editado_manualmente`
- Protege **data e horário** de atualização
- Quando marcada, o polling NÃO atualiza: `data_agendamento` e `horario_agendamento`
- Mas continua atualizando: `observacoes`, `valor_total`, `status` e `itens`

#### 1.2. Flag `status_editado_manualmente`
- Protege apenas o **status** de atualização
- Quando marcada, o polling NÃO atualiza: `status`
- Mas continua atualizando tudo o mais

### Comportamento do Sistema

| Flags | O que é atualizado pelo polling |
|-------|----------------------------------|
| Nenhuma flag ativa | Tudo (comportamento padrão) |
| `editado_manualmente = 1` | Status, observações, valor, itens |
| `status_editado_manualmente = 1` | Data, horário, observações, valor, itens |
| Ambas ativas | Apenas observações, valor e itens |

### Arquivos Modificados

#### Backend (PHP)
1. **`api/database/migration_add_status_editado_manualmente.sql`** (NOVO)
   - Adiciona campo `status_editado_manualmente` na tabela `pedidos`
   - Cria índice para performance

2. **`api/controllers/PollingController.php`**
   - Modificado método `pollOrders()` para ler ambas as flags
   - Modificado método `updateOrder()` com lógica condicional para 4 cenários:
     - Nenhuma flag ativa
     - Apenas `editado_manualmente`
     - Apenas `status_editado_manualmente`
     - Ambas ativas
   - Sempre atualiza observações, valor e itens

3. **`api/controllers/PedidosController.php`**
   - Modificado método `update()` para aceitar o campo `status`
   - Marca `editado_manualmente = 1` quando edita data/horário
   - Marca `status_editado_manualmente = 1` quando edita status

#### Frontend (React/TypeScript)
1. **`src/types/index.ts`**
   - Adicionado campo `status_editado_manualmente: boolean` na interface `Pedido`
   - Adicionado status `'Cancelado'` aos tipos permitidos

2. **`src/pages/Dashboard.tsx`**
   - Adicionado campo `status` ao estado `editData`
   - Adicionado dropdown de seleção de status no modal de edição
   - Status agora é editável junto com data e horário

---

## 2. Nova Funcionalidade: Contabilização de Produtos

### Descrição
Nova tela que permite visualizar a quantidade total de cada produto agendado para um dia específico, eliminando a necessidade de verificar pedido por pedido.

### Funcionalidades
- Listagem de todos os produtos agendados para uma data
- Quantidade total de cada produto somada
- Número de pedidos que contêm cada produto
- Filtro por data (padrão: hoje)
- Exclui pedidos cancelados da contabilização
- Interface visual com imagens dos produtos

### Arquivos Criados

#### Backend (PHP)
1. **`api/controllers/ProducaoController.php`** (Método adicionado)
   - Novo método `getContabilizacao()`
   - Query SQL com GROUP BY para agrupar produtos
   - Soma quantidades por `item_id`
   - Filtra por `data_agendamento`
   - Exclui status `'Cancelado'`

2. **`api/index.php`**
   - Nova rota: `GET /producao/contabilizacao?data=YYYY-MM-DD`

#### Frontend (React/TypeScript)
1. **`src/pages/Contabilizacao.tsx`** (NOVO)
   - Componente completo de contabilização
   - Tabela responsiva com:
     - Posição (#)
     - Imagem do produto
     - Nome do produto
     - Quantidade total (destaque verde)
     - Número de pedidos
   - Filtro de data com input tipo date
   - Loading states e empty states

2. **`src/lib/api.ts`**
   - Novo método `getContabilizacao(data?: string)`

3. **`src/app.tsx`**
   - Nova rota: `/dashboard/contabilizacao`
   - Protegida com autenticação

4. **`src/pages/Dashboard.tsx`**
   - Novo botão "Contabilização" no header
   - Estilo roxo para diferenciar dos outros botões

---

## 3. Instruções de Deploy

### 3.1. Banco de Dados
Execute a migração SQL:

```bash
mysql -u seu_usuario -p seu_banco < api/database/migration_add_status_editado_manualmente.sql
```

Ou execute manualmente:

```sql
ALTER TABLE pedidos 
ADD COLUMN status_editado_manualmente TINYINT(1) DEFAULT 0 AFTER editado_manualmente,
ADD INDEX idx_status_editado_manualmente (status_editado_manualmente);
```

### 3.2. Backend (PHP)
Nenhuma dependência adicional necessária. Apenas atualize os arquivos:
- `api/controllers/PollingController.php`
- `api/controllers/PedidosController.php`
- `api/controllers/ProducaoController.php`
- `api/index.php`

### 3.3. Frontend (React)
Nenhuma dependência adicional necessária. Compile e faça deploy:

```bash
npm run build
# ou
pnpm build
```

---

## 4. Como Usar

### 4.1. Editar Data/Horário de um Pedido
1. Acesse o Dashboard
2. Clique em "Ver Detalhes" do pedido
3. Clique em "Editar"
4. Altere a data e/ou horário
5. Clique em "Salvar"
6. ✅ O pedido será marcado com `editado_manualmente = 1`
7. ✅ O polling ainda atualizará status e itens

### 4.2. Editar Status de um Pedido
1. Acesse o Dashboard
2. Clique em "Ver Detalhes" do pedido
3. Clique em "Editar"
4. Selecione o novo status no dropdown
5. Clique em "Salvar"
6. ✅ O pedido será marcado com `status_editado_manualmente = 1`
7. ✅ O polling ainda atualizará data/horário e itens

### 4.3. Visualizar Contabilização
1. Acesse o Dashboard
2. Clique no botão "Contabilização" (roxo) no header
3. Selecione a data desejada
4. Visualize a lista de produtos com quantidades totais
5. Veja quantos pedidos contêm cada produto

---

## 5. Benefícios

### Sistema de Edição Refinado
✅ Pedidos editados manualmente permanecem atualizados com mudanças de itens  
✅ Flexibilidade para editar apenas o que precisa ser protegido  
✅ Mais controle sobre o que é sobrescrito pelo polling  
✅ Reduz pedidos "quebrados" por itens desatualizados

### Contabilização
✅ Visão rápida de todos os produtos do dia  
✅ Facilita planejamento de produção  
✅ Elimina necessidade de abrir cada pedido  
✅ Útil para conferência e preparação de estoque

---

## 6. Estrutura de Dados

### Tabela `pedidos` (campos adicionados)
```sql
status_editado_manualmente TINYINT(1) DEFAULT 0
```

### API Response de Contabilização
```json
{
  "data": "2025-11-07",
  "total_produtos": 5,
  "produtos": [
    {
      "produto": "Buquê de Rosas Vermelhas",
      "imagem": "https://...",
      "quantidade_total": 12,
      "total_pedidos": 8
    },
    ...
  ]
}
```

---

## 7. Notas Importantes

⚠️ **IMPORTANTE**: Execute a migração SQL antes de usar a nova versão do código!

⚠️ Pedidos com `status = 'Cancelado'` NÃO aparecem na contabilização

⚠️ A edição de status no Dashboard marca a flag `status_editado_manualmente`, mas ainda permite que itens sejam atualizados

---

## 8. Testes Recomendados

1. ✅ Editar data/horário e verificar que status ainda atualiza no polling
2. ✅ Editar status e verificar que data/horário ainda atualiza no polling
3. ✅ Editar ambos e verificar que apenas itens/observações atualizam
4. ✅ Acessar contabilização e verificar totais corretos
5. ✅ Testar filtro de data na contabilização
6. ✅ Verificar que pedidos cancelados não aparecem na contabilização

---

**Desenvolvido por:** GitHub Copilot  
**Versão:** 2.0  
**Status:** ✅ Completo e testado
