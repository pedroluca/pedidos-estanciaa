#!/usr/bin/env php
<?php
/**
 * Script de Cron Job para polling automático de pedidos
 * 
 * Configurar no cPanel ou servidor:
 * */1 * * * * /usr/bin/php /home/u428622816/domains/seu-dominio.com/public_html/api/cron/poll-orders.php >> /home/u428622816/domains/seu-dominio.com/public_html/api/cron/logs/poll.log 2>&1
 * 
 * Ou a cada 5 minutos:
 * */5 * * * * /usr/bin/php /home/u428622816/domains/seu-dominio.com/public_html/api/cron/poll-orders.php >> /home/u428622816/domains/seu-dominio.com/public_html/api/cron/logs/poll.log 2>&1
 */

// Carrega configurações
require_once dirname(__DIR__) . '/config/Database.php';
require_once dirname(__DIR__) . '/controllers/PollingController.php';

// Define que é execução CLI
define('IS_CLI', php_sapi_name() === 'cli');

// Se não for CLI, bloqueia acesso direto via navegador (segurança)
if (!IS_CLI) {
    // Permite apenas se vier com um token secreto
    $cronSecret = $_ENV['CRON_SECRET'] ?? 'change-this-secret';
    $providedSecret = $_GET['secret'] ?? '';
    
    if ($providedSecret !== $cronSecret) {
        http_response_code(403);
        die('Acesso negado');
    }
}

try {
    echo "[" . date('Y-m-d H:i:s') . "] Iniciando polling de pedidos...\n";
    
    $controller = new PollingController();
    
    // Chama o método de polling
    // Como estamos em CLI, vamos capturar a resposta de outra forma
    ob_start();
    $controller->pollOrders();
    $output = ob_get_clean();
    
    $result = json_decode($output, true);
    
    if ($result && isset($result['success']) && $result['success']) {
        echo "[" . date('Y-m-d H:i:s') . "] Polling concluído com sucesso!\n";
        echo "  - Novos: {$result['novos']}\n";
        echo "  - Atualizados: {$result['atualizados']}\n";
        echo "  - Total: {$result['total']}\n";
        
        if (!empty($result['erros'])) {
            echo "  - Erros:\n";
            foreach ($result['erros'] as $erro) {
                echo "    * {$erro}\n";
            }
        }
    } else {
        echo "[" . date('Y-m-d H:i:s') . "] Erro no polling\n";
        echo $output . "\n";
    }
    
    echo "\n";
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ERRO: " . $e->getMessage() . "\n";
    echo "Stack trace:\n" . $e->getTraceAsString() . "\n\n";
    exit(1);
}
