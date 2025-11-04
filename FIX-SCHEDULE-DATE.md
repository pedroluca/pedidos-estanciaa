# Fix: Data de Pedidos Agendados

## Problema Identificado
Pedidos com status `scheduled_confirmed` estavam sendo salvos com a data de criação (`created_at`) ao invés da data de agendamento (`schedule.scheduled_date_time_start`).

**Exemplo:**
- Pedido #26091 criado em 04/11/2025
- Agendado para **10/11/2025 às 10:30**
- ❌ Sistema salvava: 04/11/2025 (ERRADO)
- ✅ Deveria salvar: 10/11/2025 (CORRETO)

## Solução Implementada

### 1. Verificação de Status
Antes de definir a data, o sistema agora checa se `status === 'scheduled_confirmed'`.

### 2. Prioridade de Data
```php
if ($apiStatus === 'scheduled_confirmed' && $schedule['scheduled_date_time_start']) {
    // USA DATA DO AGENDAMENTO
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
