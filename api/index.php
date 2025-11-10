<?php

// Carrega variáveis de ambiente
if (file_exists(__DIR__ . '/.env')) {
    $env = parse_ini_file(__DIR__ . '/.env');
    foreach ($env as $key => $value) {
        $_ENV[$key] = $value;
    }
}

// Headers CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Responde OPTIONS para preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Autoload de classes
spl_autoload_register(function ($class) {
    $paths = [
        __DIR__ . '/config/',
        __DIR__ . '/controllers/',
        __DIR__ . '/helpers/'
    ];
    
    foreach ($paths as $path) {
        $file = $path . $class . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

// Roteamento simples
$requestUri = $_SERVER['REQUEST_URI'];
$requestMethod = $_SERVER['REQUEST_METHOD'];

// Remove query string da URI
$uri = strtok($requestUri, '?');

// Remove /api/ do início se existir
$uri = preg_replace('#^/api/#', '/', $uri);

// Rotas de autenticação
if ($uri === '/auth/login' && $requestMethod === 'POST') {
    $controller = new AuthController();
    $controller->login();
}

if ($uri === '/auth/register' && $requestMethod === 'POST') {
    $controller = new AuthController();
    $controller->register();
}

if ($uri === '/auth/me' && $requestMethod === 'GET') {
    $controller = new AuthController();
    $controller->me();
}

// Rotas de catálogo
if ($uri === '/catalogo/sync' && $requestMethod === 'POST') {
    $controller = new CatalogoController();
    $controller->syncFromCardapio();
}

// Rota de polling de pedidos
if ($uri === '/pedidos/poll' && $requestMethod === 'POST') {
    $controller = new PollingController();
    $controller->pollOrders();
}

// Rota de debug da API
if ($uri === '/debug/api' && $requestMethod === 'GET') {
    $controller = new PollingController();
    $controller->debugApiResponse();
}

// Rota de teste de mapeamento de pedido
if ($uri === '/debug/order-mapping' && $requestMethod === 'GET') {
    $controller = new PollingController();
    $controller->testOrderMapping();
}

if ($uri === '/catalogo/categorias' && $requestMethod === 'GET') {
    $controller = new CatalogoController();
    $controller->getCategorias();
}

if ($uri === '/catalogo/itens' && $requestMethod === 'GET') {
    $controller = new CatalogoController();
    $controller->getItens();
}

if (preg_match('#^/catalogo/itens/(\d+)$#', $uri, $matches) && $requestMethod === 'GET') {
    $controller = new CatalogoController();
    $controller->getItem($matches[1]);
}

// Rotas de pedidos
if ($uri === '/pedidos' && $requestMethod === 'GET') {
    $controller = new PedidosController();
    $controller->getAll();
}

if ($uri === '/pedidos' && $requestMethod === 'POST') {
    $controller = new PedidosController();
    $controller->create();
}

if (preg_match('#^/pedidos/(\d+)$#', $uri, $matches) && $requestMethod === 'GET') {
    $controller = new PedidosController();
    $controller->getById($matches[1]);
}

if (preg_match('#^/pedidos/(\d+)$#', $uri, $matches) && $requestMethod === 'PUT') {
    $controller = new PedidosController();
    $controller->update($matches[1]);
}

if (preg_match('#^/pedidos/(\d+)$#', $uri, $matches) && $requestMethod === 'DELETE') {
    $controller = new PedidosController();
    $controller->delete($matches[1]);
}

if ($uri === '/pedidos/painel' && $requestMethod === 'GET') {
    $controller = new PedidosController();
    $controller->getPainel();
}

// Rotas de produção
if ($uri === '/producao/toggle' && $requestMethod === 'POST') {
    $controller = new ProducaoController();
    $controller->toggleFeito();
}

if ($uri === '/producao/painel' && $requestMethod === 'GET') {
    $controller = new ProducaoController();
    $controller->getPainelProducao();
}

if ($uri === '/producao/contabilizacao' && $requestMethod === 'GET') {
    $controller = new ProducaoController();
    $controller->getContabilizacao();
}

// Rotas de estoque de perecíveis
if ($uri === '/estoque' && $requestMethod === 'GET') {
    $controller = new EstoqueController();
    $controller->listar();
}

if ($uri === '/estoque' && $requestMethod === 'POST') {
    $controller = new EstoqueController();
    $controller->criar();
}

if (preg_match('#^/estoque/(\d+)$#', $uri, $matches) && $requestMethod === 'GET') {
    $controller = new EstoqueController();
    $controller->buscar($matches[1]);
}

if (preg_match('#^/estoque/(\d+)/abater$#', $uri, $matches) && $requestMethod === 'PUT') {
    $controller = new EstoqueController();
    $controller->abater($matches[1]);
}

if (preg_match('#^/estoque/(\d+)$#', $uri, $matches) && $requestMethod === 'DELETE') {
    $controller = new EstoqueController();
    $controller->deletar($matches[1]);
}

// Rota não encontrada
Response::error('Rota não encontrada', 404);
