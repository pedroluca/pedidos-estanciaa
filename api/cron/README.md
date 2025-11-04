# Cron Job - Polling Automático

## Configuração no Hostinger (cPanel)

1. **Acesse o cPanel do Hostinger**
2. **Procure por "Cron Jobs"**
3. **Adicione um novo Cron Job**

### Configuração Recomendada (A cada 1 minuto):
```
* * * * * /usr/bin/php /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/poll-orders.php >> /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs/poll.log 2>&1
```

### Configuração Alternativa (A cada 5 minutos):
```
*/5 * * * * /usr/bin/php /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/poll-orders.php >> /home/u428622816/domains/SEU-DOMINIO/public_html/api/cron/logs/poll.log 2>&1
```

**IMPORTANTE:** Substitua `SEU-DOMINIO` pelo domínio real configurado no Hostinger.

## Verificar se está funcionando

1. Aguarde alguns minutos após configurar
2. Verifique o arquivo de log: `api/cron/logs/poll.log`
3. Deve aparecer algo como:
```
[2025-11-04 15:30:01] Iniciando polling de pedidos...
[2025-11-04 15:30:03] Polling concluído com sucesso!
  - Novos: 0
  - Atualizados: 0
  - Total: 43
```

## Acesso via URL (backup)

Se não conseguir configurar o cron, pode acessar via URL (menos seguro):

```
https://seu-dominio.com/api/cron/poll-orders.php?secret=SEU_SEGREDO_AQUI
```

Configure a variável `CRON_SECRET` no arquivo `.env` ou no servidor.

## Logs

Os logs ficam salvos em: `api/cron/logs/poll.log`

Para ver os últimos logs:
```bash
tail -f api/cron/logs/poll.log
```

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
