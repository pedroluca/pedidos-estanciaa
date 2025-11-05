# Fix: Data de Pedidos Agendados (v1.3 - ATUALIZADO)

## 🐛 Problema Original (v1.0)
Pedidos com status `scheduled_confirmed` estavam sendo salvos com a data de criação (`created_at`) ao invés da data de agendamento (`schedule.scheduled_date_time_start`).

**Status**: ✅ CORRIGIDO no `insertOrder()` (pedidos novos)

---

## 🐛 Novo Problema Descoberto (v1.3)

### Fluxo Problemático:

Quando pedidos são criados **pelo cliente no catálogo**:

1. **Status inicial**: `pending_payment` (Pagamento Pendente)
2. Sistema salva com `data_agendamento` = data de criação ❌
3. **Funcionário aceita** no Cardápio Web → Status muda para `scheduled_confirmed`
4. API agora tem `schedule.scheduled_date_time_start` com data/hora real
5. **Polling atualiza status mas NÃO atualiza data** ❌
6. **Resultado**: Pedido agendado com data incorreta

### Exemplo Real:

```
Cliente cria pedido: 05/11/2025 às 10:00 (status: pending_payment)
Funcionário aceita para: 10/11/2025 às 16:00 (status: scheduled_confirmed)

Banco antes: 05/11/2025 10:00 ❌
Banco depois (v1.0): 05/11/2025 10:00 ❌ (não atualizou!)
Banco depois (v1.3): 10/11/2025 16:00 ✅ (corrigido!)
```

---

## ✅ Solução Implementada (v1.3)

## ✅ Solução Implementada (v1.3)

### Correção no `insertOrder()` (v1.0 - já implementado)

```php
if ($apiStatus === 'scheduled_confirmed' && $schedule['scheduled_date_time_start']) {
    // USA DATA DO AGENDAMENTO para pedidos novos
    $dateTime = new DateTime($schedule['scheduled_date_time_start']);
} else {
    // USA DATA DE CRIAÇÃO para outros status
    $dateTime = new DateTime($createdAt);
}
```

### NOVA: Correção no `updateOrder()` (v1.3)

Agora quando o **status muda para `scheduled_confirmed`**, o sistema atualiza a data:

```php
private function updateOrder($pedidoId, $order) {
    // 1. Verifica se foi editado manualmente
    $editadoManualmente = ...;
    
    $apiStatus = $order['status'];
    
    // 2. Se mudou para scheduled_confirmed E não foi editado manualmente
    if ($apiStatus === 'scheduled_confirmed' && $editadoManualmente == 0) {
        $schedule = $order['schedule'];
        if ($schedule && isset($schedule['scheduled_date_time_start'])) {
            // 3. Extrai data/hora do agendamento
            $dateTime = new DateTime($schedule['scheduled_date_time_start']);
            $dataAgendamento = $dateTime->format('Y-m-d');
            $horarioAgendamento = $dateTime->format('H:i:s');
            
            // 4. Atualiza status + data + horário
            UPDATE pedidos SET 
                status = ?,
                data_agendamento = ?,
                horario_agendamento = ?,
                ...
        }
    } else {
        // 5. Apenas atualiza status (não mexe na data)
        UPDATE pedidos SET status = ?, ...
    }
}
```

### Proteções:

1. **Edição Manual**: Se `editado_manualmente = 1`, NÃO atualiza data
2. **Status Específico**: Só atualiza quando muda para `scheduled_confirmed`
3. **Campo Obrigatório**: Só atualiza se API retornar `schedule.scheduled_date_time_start`
    $dataAgendamento = DateTime($schedule['scheduled_date_time_start']);
} else {
    // USA DATA DE CRIAÇÃO
    $dataAgendamento = DateTime($order['created_at']);
}
```

### 3. Fix de Timezone
Mudou de `strtotime()` para `DateTime` para preservar timezone correto:
- ❌ `strtotime('2025-11-10T10:30:00-03:00')` → 13:30:00 (UTC+0)
- ✅ `new DateTime('2025-11-10T10:30:00-03:00')` → 10:30:00 (correto!)

## Arquivos Modificados
- `api/controllers/PollingController.php` (linhas ~240-260)

## Como Testar

### 1. Limpar pedidos antigos com data errada:
```sql
-- Opção 1: Deletar todos os pedidos agendados para reprocessar
DELETE FROM pedidos WHERE status = 'Agendado';

-- Opção 2: Deletar apenas pedidos de hoje que deveriam estar em outra data
DELETE FROM pedidos 
WHERE status = 'Agendado' 
AND data_agendamento = CURDATE();
```

### 2. Rodar polling novamente:
```bash
curl -X POST http://localhost/api/pedidos/poll
```

### 3. Verificar se os pedidos estão na data correta:
```sql
SELECT 
    numero_pedido,
    nome_cliente,
    DATE_FORMAT(data_agendamento, '%d/%m/%Y') as data,
    horario_agendamento,
    status
FROM pedidos 
WHERE status = 'Agendado'
ORDER BY data_agendamento, horario_agendamento;
```

**Resultado esperado:**
```
#26091 | Cliente X | 10/11/2025 | 10:30:00 | Agendado
#26097 | Cliente Y | 07/11/2025 | 07:30:00 | Agendado
```

## Status Afetados
Apenas pedidos com status `scheduled_confirmed` (mapeados para "Agendado" no sistema).

Outros status continuam usando `created_at` normalmente:
- `pending`, `confirmed`, `ready` → usa created_at ✅
- `scheduled_confirmed` → usa schedule.scheduled_date_time_start ✅

## Deploy
1. Upload do `PollingController.php` atualizado
2. Limpar pedidos agendados antigos (SQL acima)
3. Rodar polling manual ou aguardar cron job
4. Verificar no painel se pedidos aparecem nas datas corretas
