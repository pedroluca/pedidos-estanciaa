# Checklist de Deploy - Proteção de Edição Manual

## ⚠️ ORDEM CRÍTICA

Siga esta ordem exata para evitar erros:

## 1️⃣ PRIMEIRO: Executar Migration no Banco

**Comando no servidor MySQL**:
```bash
mysql -u usuario -p database_name < api/database/migration_add_editado_manualmente.sql
```

**OU via phpMyAdmin**:
1. Acesse phpMyAdmin
2. Selecione o banco de dados
3. Vá em "SQL"
4. Cole o conteúdo do arquivo `api/database/migration_add_editado_manualmente.sql`
5. Execute

**Verificação**:
```sql
DESCRIBE pedidos;
-- Deve mostrar a coluna 'editado_manualmente' após 'is_feito'

SHOW INDEX FROM pedidos WHERE Key_name = 'idx_editado_manualmente';
-- Deve retornar o índice criado
```

---

## 2️⃣ SEGUNDO: Upload dos Arquivos PHP

### Arquivos Backend a Enviar:

```
api/
├── controllers/
│   ├── PollingController.php    ✅ MODIFICADO - Verifica flag antes de atualizar
│   └── PedidosController.php    ✅ MODIFICADO - Define flag ao editar
└── database/
    ├── schema.sql                ✅ ATUALIZADO - Inclui nova coluna
    └── migration_add_editado_manualmente.sql  🆕 NOVO - Para deploy futuro
```

### Via FTP/SFTP:

1. Conecte ao servidor Hostinger
2. Navegue até a pasta `public_html/api/`
3. Upload de `controllers/PollingController.php` → sobrescreve
4. Upload de `controllers/PedidosController.php` → sobrescreve
5. Upload de `database/schema.sql` → sobrescreve
6. Upload de `database/migration_add_editado_manualmente.sql` → adiciona

---

## 3️⃣ TERCEIRO: Upload do Frontend

### Arquivos Frontend a Enviar:

```
dist/                             ✅ TODO CONTEÚDO
├── index.html
└── assets/
    ├── index-[hash].css
    └── index-[hash].js
```

### Via FTP/SFTP:

1. **APAGUE** toda a pasta `public_html/dist/` existente
2. Faça upload da nova pasta `dist/` completa
3. Verifique que `index.html` está na raiz de `dist/`

**OU via cPanel File Manager**:
1. Acesse cPanel
2. File Manager → `public_html/`
3. Delete pasta `dist/` antiga
4. Upload da nova pasta `dist/`
5. Extraia se necessário

---

## 4️⃣ Verificação Pós-Deploy

### Backend:

**Teste 1**: Verificar se a coluna existe
```sql
SELECT id, numero_pedido, editado_manualmente FROM pedidos LIMIT 5;
```
Deve retornar sem erro.

**Teste 2**: Verificar se o polling funciona
- Aguarde 5 minutos para próximo cron
- OU force execução: `https://seudominio.com/api/cron/poll-orders.php`
- Verifique logs em `api/cron/logs/`
- Não deve ter erros sobre coluna inexistente

### Frontend:

**Teste 3**: Abrir Dashboard
- Acesse `https://seudominio.com`
- Faça login
- Dashboard deve carregar sem erros no console

**Teste 4**: Testar edição
1. Clique em qualquer pedido
2. Clique no botão "Editar"
3. Modifique data ou horário
4. Clique em "Salvar"
5. Verifique que salvou com sucesso

**Teste 5**: Verificar proteção
```sql
-- Veja o pedido editado no passo anterior
SELECT id, numero_pedido, data_agendamento, horario_agendamento, editado_manualmente 
FROM pedidos 
WHERE editado_manualmente = 1;
```
Deve mostrar o pedido editado com `editado_manualmente = 1`.

**Teste 6**: Aguardar próximo polling
- Espere 5 minutos
- Verifique que as alterações do Teste 4 **permaneceram**
- Se foram sobrescritas, há um problema

---

## 🚨 Troubleshooting

### Erro: "Unknown column 'editado_manualmente'"

**Causa**: Migration não foi executada

**Solução**: 
1. Volte ao passo 1️⃣
2. Execute a migration no banco
3. Verifique com `DESCRIBE pedidos;`

### Erro: "Call to undefined method Response::json()"

**Causa**: Arquivo PHP não foi atualizado corretamente

**Solução**:
1. Re-upload dos arquivos PHP
2. Limpe cache do servidor se houver
3. Verifique permissões (644 para arquivos PHP)

### Pedidos ainda sendo sobrescritos

**Causa**: PollingController antigo ainda em uso

**Solução**:
1. Verifique se o arquivo `api/controllers/PollingController.php` foi realmente substituído
2. Compare última modificação do arquivo no servidor
3. Re-upload forçado

### Interface de edição não aparece

**Causa**: Frontend antigo em cache

**Solução**:
1. Limpe cache do navegador (Ctrl+Shift+Del)
2. Abra em aba anônima
3. Verifique que arquivos em `dist/assets/` têm novos hashes no nome

---

## 📋 Checklist Final

Antes de considerar deploy completo:

- [ ] Migration executada no banco de dados
- [ ] Coluna `editado_manualmente` existe em `pedidos`
- [ ] Índice `idx_editado_manualmente` criado
- [ ] Arquivos PHP enviados (PollingController, PedidosController)
- [ ] Arquivos frontend enviados (pasta dist completa)
- [ ] Dashboard abre sem erros
- [ ] Botão "Editar" aparece no modal de pedidos
- [ ] Edição funciona e salva
- [ ] Pedido editado tem `editado_manualmente = 1` no banco
- [ ] Polling não sobrescreve pedidos editados
- [ ] Pedidos não editados continuam sendo atualizados normalmente

---

## 📞 Se Houver Problemas

1. Verifique logs de erro PHP: `public_html/api/cron/logs/`
2. Console do navegador (F12) para erros frontend
3. Verifique permissões dos arquivos (644 ou 755)
4. Re-execute migration se necessário (é idempotente se usar `IF NOT EXISTS`)

---

## 🎯 Sucesso!

Se todos os itens do checklist estão marcados:
- ✅ Sistema de edição manual está funcionando
- ✅ Polling não sobrescreve alterações manuais
- ✅ Deploy completo!

---

**Última atualização**: Janeiro 2025
**Versão**: 1.0
