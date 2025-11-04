# Sistema de Pedidos - Floricultura Estância-A# React + TypeScript + Vite



Sistema completo de gerenciamento de pedidos para floricultura, com painel de produção otimizado para tablets e dashboard administrativo.This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.



## 🚀 TecnologiasCurrently, two official plugins are available:



### Backend (API PHP)- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh

- PHP 7.4+- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

- SQLite3

- JWT para autenticação## React Compiler

- Composer

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

### Frontend

- React 19## Expanding the ESLint configuration

- TypeScript

- ViteIf you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

- Tailwind CSS v4

- React Router DOM```js

export default defineConfig([

## 📁 Estrutura do Projeto  globalIgnores(['dist']),

  {

```    files: ['**/*.{ts,tsx}'],

pedidos-estanciaa/    extends: [

├── api/                    # Backend PHP      // Other configs...

│   ├── config/            # Configurações

│   ├── controllers/       # Controladores      // Remove tseslint.configs.recommended and replace with this

│   ├── database/          # Schema SQL e banco de dados      tseslint.configs.recommendedTypeChecked,

│   ├── helpers/           # Helpers (Auth, Response)      // Alternatively, use this for stricter rules

│   ├── .env              # Variáveis de ambiente      tseslint.configs.strictTypeChecked,

│   ├── .htaccess         # Configuração Apache      // Optionally, add this for stylistic rules

│   ├── composer.json     # Dependências PHP      tseslint.configs.stylisticTypeChecked,

│   └── index.php         # Ponto de entrada da API

│      // Other configs...

├── src/                   # Frontend React    ],

│   ├── components/       # Componentes reutilizáveis    languageOptions: {

│   ├── contexts/         # Context API (Auth)      parserOptions: {

│   ├── lib/              # Utilitários (API client)        project: ['./tsconfig.node.json', './tsconfig.app.json'],

│   ├── pages/            # Páginas (Login, Dashboard, Painel)        tsconfigRootDir: import.meta.dirname,

│   ├── types/            # TypeScript types      },

│   ├── app.tsx           # Componente principal      // other options...

│   └── main.tsx          # Entrada da aplicação    },

│  },

└── public/               # Arquivos estáticos])

``````



## ⚙️ Instalação e ConfiguraçãoYou can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:



### 1. Backend (API PHP)```js

// eslint.config.js

#### Requisitosimport reactX from 'eslint-plugin-react-x'

- PHP 7.4 ou superiorimport reactDom from 'eslint-plugin-react-dom'

- Extensões PHP: `pdo`, `pdo_sqlite`, `json`, `mbstring`

- Apache com mod_rewrite ou Nginxexport default defineConfig([

- Composer  globalIgnores(['dist']),

  {

#### Passos    files: ['**/*.{ts,tsx}'],

    extends: [

1. **Navegue para a pasta da API:**      // Other configs...

   ```bash      // Enable lint rules for React

   cd api      reactX.configs['recommended-typescript'],

   ```      // Enable lint rules for React DOM

      reactDom.configs.recommended,

2. **Instale as dependências:**    ],

   ```bash    languageOptions: {

   composer install      parserOptions: {

   ```        project: ['./tsconfig.node.json', './tsconfig.app.json'],

        tsconfigRootDir: import.meta.dirname,

3. **Configure as variáveis de ambiente:**      },

   ```bash      // other options...

   cp .env.example .env    },

   ```  },

   ])

   Edite o arquivo `.env` e configure:```

   ```env
   DB_PATH=./database/pedidos.db
   JWT_SECRET=seu_secret_super_secreto_aqui_mude_isso
   CARDAPIO_API_URL=https://api.cardapiodigital.io
   CARDAPIO_API_TOKEN=seu_token_do_cardapio_web_aqui
   ```

4. **Inicialize o banco de dados:**
   ```bash
   php init-db.php
   ```

5. **Configure o servidor web:**

   **Apache (.htaccess já configurado):**
   - Certifique-se de que `mod_rewrite` está habilitado
   - Aponte o DocumentRoot ou crie um VirtualHost para a pasta `api/`

   **PHP Built-in Server (desenvolvimento):**
   ```bash
   php -S localhost:8000 -t .
   ```

6. **Teste a API:**
   ```bash
   curl http://localhost:8000/auth/login
   ```

### 2. Frontend (React)

#### Requisitos
- Node.js 18+ ou Bun
- pnpm, npm ou yarn

#### Passos

1. **Instale as dependências:**
   ```bash
   pnpm install
   # ou
   npm install
   ```

2. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env
   ```
   
   Edite o arquivo `.env`:
   ```env
   VITE_API_URL=http://localhost:8000
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   pnpm dev
   # ou
   npm run dev
   ```

4. **Acesse a aplicação:**
   - Frontend: `http://localhost:5173`
   - Login padrão: `admin@estanciaa.com` / `admin123`

## 📚 Uso

### Login
- Acesse `/login` para fazer login no sistema
- Use as credenciais padrão ou crie um novo usuário

### Dashboard
- `/dashboard` - Área administrativa (requer autenticação)
- Visualize todos os pedidos
- Filtre por data (hoje, futuros, todos)
- Crie novos pedidos
- Gerencie o catálogo

### Painel de Produção
- `/painel` - Visualização otimizada para tablets (acesso público)
- Mostra pedidos do dia divididos por período (manhã/tarde)
- Auto-atualização a cada 30 segundos
- Modo fullscreen
- Exibe imagens grandes dos produtos para facilitar a produção

## 🔌 API Endpoints

### Autenticação
- `POST /auth/login` - Login
- `POST /auth/register` - Registro
- `GET /auth/me` - Dados do usuário autenticado

### Catálogo
- `POST /catalogo/sync` - Sincroniza catálogo do Cardápio Web (requer auth)
- `GET /catalogo/categorias` - Lista categorias
- `GET /catalogo/itens` - Lista itens
- `GET /catalogo/itens/:id` - Detalhes de um item

### Pedidos
- `GET /pedidos` - Lista pedidos (query: `?data=2025-11-04&status=Aguardando`)
- `POST /pedidos` - Cria pedido (requer auth)
- `GET /pedidos/:id` - Detalhes de um pedido
- `PUT /pedidos/:id` - Atualiza pedido (requer auth)
- `DELETE /pedidos/:id` - Deleta pedido (requer auth)
- `GET /pedidos/painel` - Pedidos do painel (query: `?data=2025-11-04`)

## 🔄 Sincronização com Cardápio Web

Para importar o catálogo completo do Cardápio Web:

1. Configure o `CARDAPIO_API_TOKEN` no `.env` da API
2. Faça login no sistema
3. Execute a sincronização:
   ```bash
   curl -X POST http://localhost:8000/catalogo/sync \
     -H "Authorization: Bearer SEU_TOKEN_JWT"
   ```

Isso irá importar todas as categorias e itens do seu catálogo.

## 🏗️ Build para Produção

### Frontend
```bash
pnpm build
# ou
npm run build
```

Os arquivos compilados estarão em `dist/`

### Backend
- Certifique-se de que o banco de dados está em local seguro
- Configure permissões adequadas
- Use HTTPS em produção
- Mude o `JWT_SECRET` para um valor seguro

## 📝 Próximos Passos

- [ ] Implementar página de criação/edição de pedidos no Dashboard
- [ ] Adicionar notificações em tempo real
- [ ] Implementar impressão de pedidos
- [ ] Adicionar relatórios e estatísticas
- [ ] Implementar busca avançada
- [ ] Adicionar suporte a anexos/fotos nos pedidos
- [ ] Sistema de backup automático

## 🤝 Suporte

Para dúvidas ou problemas, entre em contato com o desenvolvedor.

## 📄 Licença

Uso privado - Floricultura Estância-A
