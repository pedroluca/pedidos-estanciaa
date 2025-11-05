# Guia de Deploy - Funcionalidade de Produção

## Passo a Passo para Subir para o Servidor

### 1. Atualizar Banco de Dados

Acesse phpMyAdmin no Hostinger e execute:

```sql
ALTER TABLE pedidos 
ADD COLUMN is_feito TINYINT(1) DEFAULT 0 AFTER valor_total,
ADD INDEX idx_is_feito (is_feito);
```

Ou faça upload e execute o arquivo:
- `api/database/migration_add_is_feito.sql`

### 2. Upload dos Arquivos Backend

Faça upload dos seguintes arquivos via FTP/File Manager:

**Novos arquivos:**
- `api/controllers/ProducaoController.php`
- `api/database/migration_add_is_feito.sql`

**Arquivos modificados:**
- `api/index.php` (novas rotas de produção)
- `api/database/schema.sql` (atualizado com is_feito)

### 3. Upload do Frontend

Faça upload da pasta `dist/` completa:
- `dist/index.html`
- `dist/assets/index-BgB-ascA.css`
- `dist/assets/index-C1Qi8-Mw.js`

### 4. Testar as Funcionalidades

#### 4.1 Testar Filtro de Data:
1. Acesse o Painel de Produção
2. Clique no campo de data no cabeçalho
3. Selecione amanhã ou qualquer outra data
4. Verifique se os pedidos são carregados corretamente

#### 4.2 Testar Marcação de Produção:
1. Clique no botão "Marcar como Produzido" em um pedido
2. Verifique se aparece a badge "✓ PRODUZIDO" no canto
3. O botão deve mudar para "Desmarcar Produzido"
4. Clique novamente para desmarcar
5. A badge deve desaparecer

#### 4.3 Verificar no Banco:
```sql
SELECT numero_pedido, nome_cliente, is_feito 
FROM pedidos 
WHERE data_agendamento = CURDATE()
ORDER BY horario_agendamento;
```

### 5. Verificar Logs de Erro

Se algo não funcionar, verifique:
- Console do navegador (F12 → Console)
- Network tab (F12 → Network) para ver requisições
- Logs do PHP no servidor

## URLs das Novas APIs

- `POST https://seu-dominio.com/api/producao/toggle`
- `GET https://seu-dominio.com/api/producao/painel?data=2025-11-05`

## Rollback (Se necessário)

Se algo der errado:

1. **Banco de Dados:**
```sql
ALTER TABLE pedidos DROP COLUMN is_feito;
```

2. **Backend:** Remova as linhas das rotas de produção do `api/index.php`

3. **Frontend:** Restaure a versão anterior da pasta `dist/`

## Recursos Visuais da Nova Funcionalidade

### Filtro de Data:
- Input de data no cabeçalho ao lado do título
- Ícone de calendário
- Fundo escuro com borda

### Badge PRODUZIDO:
- Verde (`bg-emerald-600`)
- Posicionada no canto superior direito
- Rotação de 12° para destaque
- Texto: "✓ PRODUZIDO"

### Botão de Marcação:
- Verde quando não está marcado
- Cinza quando já está marcado
- Largura total do card
- Texto dinâmico

### Layout das Imagens:
- Uma imagem grande por pedido
- Badge vermelha com contador (+X itens)
- Altura fixa: 48 (12rem)

## Observações Importantes

- ✅ O campo `is_feito` é independente do status vindo da API
- ✅ A marcação persiste mesmo após polling
- ✅ Funciona offline após carregar os pedidos
- ✅ Não interfere nas operações existentes
- ✅ Compatible com todos os status do Cardápio Web

## Troubleshooting

**Problema:** Badge não aparece após marcar
- Verifique se a coluna `is_feito` foi criada no banco
- Verifique se o ProducaoController.php está no servidor
- Veja o console para erros de API

**Problema:** Filtro de data não funciona
- Verifique se a rota `/api/producao/painel` está ativa
- Teste diretamente no navegador: `https://seu-dominio.com/api/producao/painel?data=2025-11-05`

**Problema:** Erro 404 nas rotas
- Verifique se o arquivo `api/index.php` foi atualizado
- Verifique se o `.htaccess` está correto
