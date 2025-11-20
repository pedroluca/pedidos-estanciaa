# Cron Jobs - Polling Automático

## Auto-Poll (Novo - Importante!)

Script que executa polling automaticamente a cada 30 minutos, garantindo que pedidos sejam sincronizados mesmo com o painel fechado.

### Arquivo: `auto-poll.php`

Executa o polling completo sem necessidade de autenticação, ideal para rodar como cron job no servidor.

**Benefícios:**
- ✅ Sincroniza pedidos mesmo com painel fechado
- ✅ Evita pedidos ficarem "perdidos" por mais de 30 minutos
- ✅ Logs detalhados de cada execução
- ✅ Respeita flags de edição manual

## Configuração no Hostinger (cPanel)

### 1. Acesse o cPanel do Hostinger
2. **Procure por "Cron Jobs"**
3. **Adicione um novo Cron Job**

### ⭐ Configuração do Auto-Poll (RECOMENDADO):

**A cada 30 minutos:**
```bash
*/30 * * * * /usr/bin/php /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/auto-poll.php >> /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs/auto-poll.log 2>&1
```

**Ou a cada 15 minutos (mais frequente):**
```bash
*/15 * * * * /usr/bin/php /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/auto-poll.php >> /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs/auto-poll.log 2>&1
```

### Configuração Antiga (poll-orders.php - Pode remover):
```bash
* * * * * /usr/bin/php /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/poll-orders.php >> /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs/poll.log 2>&1
```

**IMPORTANTE:** Substitua `SEU-DOMINIO` pelo domínio real configurado no Hostinger.

## Verificar se está funcionando

1. Aguarde alguns minutos após configurar
2. Verifique o arquivo de log: `api/cron/logs/poll.log`
3. Deve aparecer algo como:
```
[2025-11-04 15:30:01] Iniciando polling de pedidos...
[2025-11-04 15:30:03] Polling concluído com sucesso!
## Verificar se está funcionando

### Via Logs:
```bash
tail -f api/cron/logs/auto-poll.log
```

Você verá algo como:
```
[2025-11-19 14:30:01] ========================================
[2025-11-19 14:30:01] Iniciando polling automático
[2025-11-19 14:30:01] Data/Hora: 2025-11-19 14:30:01
[2025-11-19 14:30:02] Total de pedidos retornados: 15
[2025-11-19 14:30:05] Polling concluído com sucesso
[2025-11-19 14:30:05] Novos pedidos: 2
[2025-11-19 14:30:05] Pedidos atualizados: 3
[2025-11-19 14:30:05] Erros: 0
[2025-11-19 14:30:05] Tempo de execução: 4.23s
[2025-11-19 14:30:05] ========================================
```

### Via Banco de Dados:
Verifique se novos pedidos estão aparecendo na tabela `pedidos` mesmo com o painel fechado.

## Acesso via URL (backup - NÃO RECOMENDADO)

Se não conseguir configurar o cron, pode acessar via URL (menos seguro):

```
https://seu-dominio.com/api/cron/poll-orders.php?secret=SEU_SEGREDO_AQUI
```

Configure a variável `CRON_SECRET` no arquivo `.env` ou no servidor.

## Limpeza de Logs Antigos

Para evitar acúmulo, adicione ao crontab:
```bash
0 3 * * * find /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs -name "*.log" -mtime +7 -delete
```

Isso limpa logs com mais de 7 dias, todo dia às 3h da manhã.

## Troubleshooting

### Cron não está executando?
1. Verifique se o caminho do PHP está correto: `/usr/bin/php` ou `/usr/local/bin/php`
2. Verifique se o caminho completo do script está correto
3. Verifique permissões do arquivo: `chmod +x poll-orders.php`
4. Verifique o log do cron no cPanel

### Como encontrar o caminho do PHP?
Execute no terminal SSH:
```bash
which php
```

### Permissões
```bash
chmod +x api/cron/poll-orders.php
chmod 755 api/cron/logs
```
