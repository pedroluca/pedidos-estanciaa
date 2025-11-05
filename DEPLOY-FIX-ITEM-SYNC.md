# Checklist de Deploy - Correção de Sincronização de Itens (v1.2)

## 🐛 Bugs Corrigidos

**v1.1**: Pedidos com itens alterados não atualizavam.  
**v1.2**: Itens cancelados apareciam no sistema junto com os novos.

**Exemplo Real**: Pedido #26139 - Cliente trocou Buquê M por Buquê P, mas ambos apareciam.

**Solução**: Sistema agora filtra itens cancelados automaticamente.

---

## 📦 Arquivos Para Deploy

### Modificados:

```
api/controllers/PollingController.php  ✅ MODIFICADO (v1.2)
```

**Mudanças v1.2**:
- ✅ Novo método `isItemCancelled()` - detecta itens cancelados
- ✅ Filtro aplicado em `updateOrder()`
- ✅ Filtro aplicado em `verificarMudancaItens()`

### Novo (Opcional - para debug):

```
api/debug_cancelled_items.php  🆕 NOVO (opcional)
```

**Uso**: Ver estrutura real dos itens da API e confirmar filtro

---

## 🚀 Deploy Simples

### Via FTP/SFTP:

1. Conecte ao servidor Hostinger
2. Navegue até `public_html/api/controllers/`
3. Upload de `PollingController.php` (sobrescreve)
4. ✅ Pronto!

### Via cPanel:

1. File Manager → `public_html/api/controllers/`
2. Delete `PollingController.php` antigo
3. Upload do novo
4. ✅ Pronto!

---

## ✅ Verificação

### Teste 1: Script de Debug (Recomendado!)

```bash
# Via terminal
php api/debug_cancelled_items.php

# OU via navegador
https://seudominio.com/api/debug_cancelled_items.php
```

**Edite o arquivo primeiro**: Linha 17, coloque o ID do pedido #26139 (ou outro com item cancelado)

**O que esperar**:
- Lista de todos os itens do pedido
- Destaque em campos que indicam cancelamento
- Detecção automática de itens cancelados
- Confirmação de que o filtro está funcionando

### Teste 2: Pedido Real

1. ✅ No Cardápio Web: Crie pedido com 2 itens
2. ✅ Aguarde sincronização (5 min ou force polling)
3. ✅ No Cardápio Web: Cancele 1 item e adicione outro
4. ✅ Aguarde sincronização
5. ✅ No Dashboard: Verifique que apenas os itens ativos aparecem

### Teste 3: Banco de Dados

```sql
-- Ver itens do pedido #26139
SELECT pi.*, i.nome 
FROM pedidos_itens pi
JOIN itens i ON pi.item_id = i.id
JOIN pedidos p ON pi.pedido_id = p.id
WHERE p.numero_pedido = '26139';

-- Deve retornar APENAS "Buquê Flores do Campo P"
-- NÃO deve ter "Buquê Flores do Campo M"
```

---

## 🎯 O Que Mudou

### ANTES:
```php
// Só atualizava se status mudasse
if ($existing['status'] !== $statusNovo) {
    $this->updateOrder($existing['id'], $order);
}
```
❌ Mudança de itens ignorada

### DEPOIS:
```php
// Atualiza se status OU itens mudarem
$itensMudaram = $this->verificarMudancaItens($existing['id'], $order['items'] ?? []);

if ($existing['status'] !== $statusNovo || $itensMudaram) {
    $this->updateOrder($existing['id'], $order);
}
```
✅ Detecta mudanças de itens!

---

## 🛡️ Segurança

✅ Edição manual continua protegida (flag `editado_manualmente`)  
✅ Transações do banco garantem consistência  
✅ Sem alterações no banco de dados  
✅ Compatível com versão anterior  

---

## 📊 Detecta Estes Casos

| Cenário | v1.0 (Original) | v1.1 | v1.2 (Atual) |
|---------|-----------------|------|--------------|
| Item cancelado (flag na API) | ❌ Inseria | ❌ Inseria | ✅ **Filtra** |
| Item substituído | ❌ Não detectava | ✅ Detectava mas inseria ambos | ✅ **Remove antigo, insere novo** |
| Item adicionado | ❌ Não detectava | ✅ Insere | ✅ Insere |
| Quantidade alterada | ❌ Não detectava | ✅ Atualiza | ✅ Atualiza |
| Só status mudou | ✅ Atualizava | ✅ Atualiza | ✅ Atualiza |
| Pedido editado manual | ✅ Respeitava | ✅ Respeita | ✅ Respeita |

---

## 🚨 Troubleshooting

### Erro: Parse error no PHP

**Causa**: Upload incompleto ou corrompido

**Solução**:
1. Delete o arquivo no servidor
2. Re-upload completo
3. Verifique permissões (644)

### Itens ainda não atualizam

**Causa**: Código antigo em cache ou não substituído

**Solução**:
1. Verifique data de modificação do arquivo no servidor
2. Compare tamanho do arquivo (deve ser ~15KB)
3. Re-upload forçado
4. Limpe cache OPcache se houver

### Polling para de funcionar

**Causa**: Erro de sintaxe PHP

**Solução**:
1. Verifique logs: `api/cron/logs/poll.log`
2. Teste manual: acesse `/api/cron/poll-orders.php`
3. Se houver erro, reverta para versão anterior

---

## 📋 Checklist Final

Antes de considerar deploy completo:

- [ ] Arquivo `PollingController.php` enviado
- [ ] Polling executa sem erros
- [ ] Logs não mostram erros PHP
- [ ] Teste com pedido real funcionou
- [ ] Itens cancelados são removidos
- [ ] Itens adicionados aparecem
- [ ] Edição manual continua funcionando

---

## 🎉 Sucesso

Se todos os itens estão marcados:
- ✅ Bug de sincronização de itens corrigido
- ✅ Sistema totalmente funcional
- ✅ Deploy completo!

---

**Arquivo Deploy**:  
`api/controllers/PollingController.php`

**Tempo estimado**: 2 minutos  
**Risco**: Baixo (apenas 1 arquivo, sem mudanças no DB)  
**Rollback**: Simples (substituir por versão anterior se necessário)

**Data**: 05/11/2025  
**Versão**: 1.1
