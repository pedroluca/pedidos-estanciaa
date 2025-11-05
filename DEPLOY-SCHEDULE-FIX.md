# Deploy v1.3 - Atualização de Data ao Confirmar Agendamento

## 📦 Arquivo Para Deploy

```
api/controllers/PollingController.php  ✅ MODIFICADO (v1.3)
```

**Mudança**: Método `updateOrder()` agora atualiza `data_agendamento` e `horario_agendamento` quando status muda para `scheduled_confirmed`.

---

## 🚀 Deploy (2 minutos)

### Via FTP/cPanel:
1. Conecte ao servidor
2. Navegue: `public_html/api/controllers/`
3. Upload de `PollingController.php` (sobrescreve)
4. ✅ Pronto!

---

## ✅ Teste Rápido

### Cenário Real de Teste:

1. **No Cardápio Web (como cliente)**:
   - Crie um pedido
   - Deixe como "Pagamento Pendente"

2. **Aguarde polling** (5 min ou force: `/api/cron/poll-orders.php`)

3. **Verifique no banco**:
```sql
SELECT numero_pedido, status, data_agendamento, horario_agendamento 
FROM pedidos 
WHERE numero_pedido = 'SEU_PEDIDO';

-- Deve mostrar:
-- status: Aguardando
-- data_agendamento: [data de hoje]
```

4. **No Cardápio Web (como funcionário)**:
   - Aceite o pedido
   - Escolha data futura (ex: daqui 5 dias)
   - Status muda para "Agendado"

5. **Aguarde próximo polling** (5 min)

6. **Verifique novamente**:
```sql
SELECT numero_pedido, status, data_agendamento, horario_agendamento 
FROM pedidos 
WHERE numero_pedido = 'SEU_PEDIDO';

-- Deve mostrar:
-- status: Agendado
-- data_agendamento: [data escolhida pelo funcionário] ✅
```

---

## 🎯 O Que Mudou

### ANTES (v1.2):
```
Pedido criado: 05/11/2025 10:00 (pending_payment)
Funcionário aceita para: 10/11/2025 16:00
Polling atualiza: status → Agendado
                  data → 05/11/2025 10:00 ❌ (não mudou!)
```

### AGORA (v1.3):
```
Pedido criado: 05/11/2025 10:00 (pending_payment)
Funcionário aceita para: 10/11/2025 16:00
Polling atualiza: status → Agendado
                  data → 10/11/2025 16:00 ✅ (atualizada!)
```

---

## 🛡️ Proteções

- ✅ Pedidos editados manualmente **não** são sobrescritos
- ✅ Apenas status `scheduled_confirmed` dispara atualização
- ✅ Requer campo `schedule.scheduled_date_time_start` na API
- ✅ Compatível com todas as funcionalidades existentes:
  - Edição manual
  - Filtro de itens cancelados
  - Detecção de mudanças nos itens

---

## 📋 Checklist

- [ ] Arquivo `PollingController.php` enviado
- [ ] Polling executa sem erros
- [ ] Teste com pedido pendente → confirmado
- [ ] Data atualizada corretamente
- [ ] Edição manual continua protegida

---

## 🚨 Rollback (Se Necessário)

Se houver problemas, apenas substitua por versão anterior (v1.2):
- A query adicional é não-destrutiva
- Nenhuma alteração no banco de dados
- Versão anterior funciona normalmente

---

**Tempo estimado**: 2 minutos  
**Risco**: Baixíssimo  
**Sem alterações no banco**: ✅

**Versão**: 1.3  
**Data**: 05/11/2025
