# Alterações Implementadas - Sistema de Pedidos

## ✅ [05/11/2025 - v1.2] Filtro de Itens Cancelados

### 🐛 Problema Descoberto:
**Caso Real (Pedido #26139)**: Cliente cancelou "Buquê M" e selecionou "Buquê P", mas ambos apareciam no sistema.

**Causa**: A API retorna todos os itens na lista, incluindo os cancelados (com flag indicando cancelamento). O sistema inseria todos sem filtrar.

### ✨ Solução:
- Novo método `isItemCancelled($item)` que verifica múltiplos campos:
  - `cancelled: true`
  - `deleted: true`
  - `status: 'cancelled'` (ou deleted, canceled, inactive)
  - `active: false`
- Filtro aplicado em `updateOrder()` e `verificarMudancaItens()`
- Apenas itens **ativos** são inseridos no banco

### 🔍 Debug:
- Criado script `api/debug_cancelled_items.php`
- Mostra estrutura completa dos itens da API
- Detecta automaticamente quais campos indicam cancelamento

### Arquivos Modificados:
- `api/controllers/PollingController.php`
  - Novo método: `isItemCancelled()`
  - Filtro em `updateOrder()` e `verificarMudancaItens()`
- 🆕 `api/debug_cancelled_items.php` - Script de debug

### Resultado:
- ✅ Itens cancelados não aparecem mais no sistema
- ✅ Apenas itens ativos são salvos no banco
- ✅ Substituições funcionam corretamente

---

## ✅ [05/11/2025 - v1.1] Correção: Sincronização de Itens dos Pedidos

### 🐛 Bug Corrigido:
**Problema**: Pedidos com itens alterados (cancelados/substituídos) no Cardápio Web não atualizavam no sistema.

**Causa**: O polling só verificava mudanças no **status** do pedido, ignorando completamente mudanças nos **itens**.

### ✨ Solução Implementada:
- Novo método `verificarMudancaItens()` que compara:
  - IDs dos itens (detecta adições/remoções)
  - Quantidades (detecta alterações)
- Polling agora atualiza quando: **status OU itens mudarem**

### Arquivos Modificados:
- `api/controllers/PollingController.php`
  - Novo método: `verificarMudancaItens()`
  - Lógica atualizada em `pollOrders()` (linha ~205)

### Cenários Agora Cobertos:
- ✅ Item cancelado → Removido do banco
- ✅ Item adicionado → Inserido no banco
- ✅ Item substituído → Antigo removido, novo inserido
- ✅ Quantidade alterada → Atualizada
- ✅ Edição manual → Continua protegida

### Deploy:
📄 Guia: `DEPLOY-FIX-ITEM-SYNC.md`  
📋 Documentação: `FIX-ITEM-SYNC.md`

---

## ✅ 1. Mudança de ID para DISPLAY_ID

### O que foi alterado:
- **Antes**: Sistema salvava o `id` do pedido (UUID interno da API: `f3e2d1c0-b4a5-...`)
- **Agora**: Sistema salva o `display_id` (número amigável: `149673452`)

### Arquivos modificados:
- `api/controllers/PollingController.php`
  - Linha ~104: Mapeamento de debug atualizado
  - Linha ~183: Usa `display_id` ao verificar pedidos existentes
  - Linha ~237: Usa `display_id` ao inserir novos pedidos

### Por que isso é importante:
Os números amigáveis (149673452, 149674705, etc.) são os que aparecem pro cliente e facilitam a identificação visual dos pedidos.

---

## ✅ 2. Cron Job Automático (Polling no Servidor)

### O que foi criado:
- **Novo arquivo**: `api/cron/poll-orders.php` - Script PHP executável
- **Novo arquivo**: `api/cron/README.md` - Instruções de configuração
- **Nova pasta**: `api/cron/logs/` - Para salvar logs de execução

### Como funciona:
- O servidor executa o script automaticamente a cada X minutos
- Não depende mais do frontend estar aberto
- Funciona 24/7, inclusive fins de semana

### Como configurar no Hostinger (cPanel):

1. **Acesse o cPanel** → Procure "Cron Jobs"
2. **Adicione este comando** (ajuste o caminho para o seu domínio):

**A cada 1 minuto:**
```bash
* * * * * /usr/bin/php /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/poll-orders.php >> /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs/poll.log 2>&1
```

**A cada 5 minutos (recomendado para economizar recursos):**
```bash
*/5 * * * * /usr/bin/php /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/poll-orders.php >> /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs/poll.log 2>&1
```

3. **Substitua** `SEU-DOMINIO` pelo domínio real
4. **Aguarde 5-10 minutos** e verifique se está funcionando

### Como verificar se está funcionando:
1. Após configurar, aguarde o tempo do cron (1 ou 5 minutos)
2. Verifique o arquivo de log via FTP ou File Manager:
   - Caminho: `api/cron/logs/poll.log`
   - Deve ter linhas como:
   ```
   [2025-11-04 15:30:01] Iniciando polling de pedidos...
   [2025-11-04 15:30:03] Polling concluído com sucesso!
     - Novos: 0
     - Atualizados: 0
     - Total: 43
   ```

### Alternativa (se não conseguir configurar cron):
Pode chamar via URL com um segredo:
```
https://seu-dominio.com/api/cron/poll-orders.php?secret=SUA_SENHA_SECRETA
```
Configure a senha no arquivo `.env` ou nas variáveis de ambiente.

---

## ✅ 3. Cadastro Manual de Pedidos

### O que foi ajustado:
- **Arquivo**: `src/pages/NovoPedido.tsx`
- Simplificado para cadastro rápido
- Removidos campos desnecessários (tipo entrega, endereço)
- Foco em: **Código do Pedido, Cliente, Data/Hora, Itens**

### Como acessar:
1. Login no Dashboard Admin
2. Clique em "Novo Pedido" no menu
3. Preencha:
   - **Código do Pedido** (ex: 149673452)
   - **Nome do Cliente**
   - **Telefone** (opcional)
   - **Data e Hora** (já vem preenchida com agora)
   - **Selecione os itens** do catálogo
   - **Observações** (opcional)
4. Clique em "Criar Pedido"

### Quando usar:
- Pedidos antigos (> 8 horas) que ficaram de fora do polling
- Pedidos que deram erro no polling automático
- Pedidos manuais que não vieram do Cardápio Web

---

## 📋 Resumo das Mudanças

| # | Mudança | Status | Impacto |
|---|---------|--------|---------|
| 1 | display_id ao invés de id | ✅ Concluído | Números mais legíveis no painel |
| 2 | Cron job automático | ✅ Precisa configurar | Polling funciona sem frontend aberto |
| 3 | Cadastro manual | ✅ Concluído | Adicionar pedidos antigos manualmente |

---

## 🚀 Próximos Passos (VOCÊ DEVE FAZER):

### 1. Upload dos arquivos novos para o servidor:
- `api/cron/poll-orders.php`
- `api/cron/README.md`
- `api/cron/logs/.gitignore`

### 2. Dar permissão de execução no arquivo:
Via terminal SSH ou File Manager do cPanel:
```bash
chmod +x /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/poll-orders.php
chmod 755 /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs
```

### 3. Configurar o Cron Job no cPanel:
Siga as instruções do `api/cron/README.md`

### 4. Upload do PollingController.php atualizado:
Substitua o arquivo no servidor para usar display_id

### 5. Upload do frontend atualizado:
```bash
pnpm run build
```
Depois suba os arquivos da pasta `dist/` para o servidor

---

## 🔍 Como Testar

### Teste 1: Display ID
1. Rode o polling: `POST /api/pedidos/poll`
2. Veja um pedido: `GET /api/pedidos/{id}`
3. O campo `numero_pedido` deve ter números tipo `149673452` (não UUID)

### Teste 2: Cron Job
1. Configure o cron no cPanel
2. Aguarde 5-10 minutos
3. Veja o arquivo `api/cron/logs/poll.log`
4. Deve ter linhas com horário de execução

### Teste 3: Cadastro Manual
1. Acesse Dashboard → Novo Pedido
2. Preencha os campos
3. Selecione alguns itens
4. Salve e veja se aparece no Dashboard

---

## ❓ Problemas Comuns

### "Cron não está executando"
- Verifique o caminho do PHP: `/usr/bin/php` ou `/usr/local/bin/php`
- No terminal SSH: `which php`
- Verifique permissões: `chmod +x poll-orders.php`

### "Display ID ainda mostra UUID"
- Faça upload do `PollingController.php` atualizado
- Rode o polling novamente para atualizar os pedidos existentes

### "Página de Novo Pedido em branco"
- Faça `pnpm run build` novamente
- Suba os arquivos atualizados para o servidor
- Limpe o cache do navegador (Ctrl+Shift+R)

---

**Data da alteração**: 04/11/2025  
**Versão**: 2.0
