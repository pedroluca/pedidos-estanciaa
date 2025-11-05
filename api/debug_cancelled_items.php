<?php
/**
 * Script de Debug: Verificar Estrutura de Itens Cancelados
 * 
 * Use este script para ver exatamente o que a API retorna
 * quando um pedido tem itens cancelados/trocados.
 * 
 * COMO USAR:
 * 1. Substitua $orderId pelo número do pedido #26139
 * 2. Execute: php api/debug_cancelled_items.php
 * 3. Veja quais campos indicam que um item foi cancelado
 */

require_once __DIR__ . '/config/Database.php';

$orderId = '26139'; // Substitua pelo ID real do pedido com item cancelado
$token = '3swop3XGaLQz6M134TcJdPpqoHN8ZtJhYfLD9PH9';

echo "========================================\n";
echo "DEBUG: Estrutura de Itens Cancelados\n";
echo "========================================\n\n";

echo "Buscando detalhes do pedido #{$orderId}...\n\n";

// Busca detalhes completos do pedido
$ch = curl_init("https://integracao.cardapioweb.com/api/partner/v1/orders/{$orderId}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-KEY: ' . $token,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    echo "❌ Erro HTTP {$httpCode}\n";
    exit(1);
}

$order = json_decode($response, true);

if (!$order) {
    echo "❌ Resposta inválida da API\n";
    exit(1);
}

echo "✅ Pedido encontrado!\n\n";
echo "Display ID: " . ($order['display_id'] ?? 'N/A') . "\n";
echo "Status: " . ($order['status'] ?? 'N/A') . "\n\n";

if (!isset($order['items']) || !is_array($order['items'])) {
    echo "❌ Nenhum item encontrado no pedido\n";
    exit(1);
}

echo "========================================\n";
echo "ITENS DO PEDIDO (" . count($order['items']) . " total)\n";
echo "========================================\n\n";

foreach ($order['items'] as $index => $item) {
    echo "--- ITEM #" . ($index + 1) . " ---\n";
    echo "Nome: " . ($item['name'] ?? 'N/A') . "\n";
    echo "Item ID: " . ($item['item_id'] ?? 'N/A') . "\n";
    echo "Quantidade: " . ($item['quantity'] ?? 'N/A') . "\n";
    
    // Mostra TODOS os campos do item
    echo "\n📋 Campos completos:\n";
    foreach ($item as $key => $value) {
        if (is_bool($value)) {
            $displayValue = $value ? 'true' : 'false';
        } elseif (is_array($value)) {
            $displayValue = json_encode($value);
        } else {
            $displayValue = $value;
        }
        
        // Destaca campos que podem indicar cancelamento
        $highlightFields = ['cancelled', 'deleted', 'status', 'active', 'canceled'];
        $prefix = in_array(strtolower($key), $highlightFields) ? '⚠️  ' : '   ';
        
        echo "{$prefix}{$key}: {$displayValue}\n";
    }
    echo "\n";
}

echo "========================================\n";
echo "ANÁLISE\n";
echo "========================================\n\n";

echo "🔍 Procure por campos como:\n";
echo "  - 'cancelled' ou 'canceled' = true\n";
echo "  - 'deleted' = true\n";
echo "  - 'status' = 'cancelled' ou 'deleted'\n";
echo "  - 'active' = false\n\n";

echo "📝 Se encontrar itens cancelados, anote qual campo\n";
echo "   indica o cancelamento para confirmar que o código\n";
echo "   está filtrando corretamente.\n\n";

// Tenta detectar automaticamente
$canceladosDetectados = [];
foreach ($order['items'] as $index => $item) {
    $nome = $item['name'] ?? "Item " . ($index + 1);
    
    if (isset($item['cancelled']) && $item['cancelled'] === true) {
        $canceladosDetectados[] = "{$nome} (campo 'cancelled' = true)";
    }
    if (isset($item['deleted']) && $item['deleted'] === true) {
        $canceladosDetectados[] = "{$nome} (campo 'deleted' = true)";
    }
    if (isset($item['status'])) {
        $cancelledStatuses = ['cancelled', 'deleted', 'canceled', 'inactive'];
        if (in_array(strtolower($item['status']), $cancelledStatuses)) {
            $canceladosDetectados[] = "{$nome} (campo 'status' = '{$item['status']}')";
        }
    }
    if (isset($item['active']) && $item['active'] === false) {
        $canceladosDetectados[] = "{$nome} (campo 'active' = false)";
    }
}

if (!empty($canceladosDetectados)) {
    echo "✅ ITENS CANCELADOS DETECTADOS:\n";
    foreach ($canceladosDetectados as $item) {
        echo "  - {$item}\n";
    }
    echo "\n✅ O código atual deve filtrar esses itens corretamente!\n";
} else {
    echo "⚠️  Nenhum item cancelado detectado automaticamente.\n";
    echo "   Verifique manualmente os campos acima.\n";
    echo "   Se houver um campo não coberto, informe para atualizar o código.\n";
}

echo "\n========================================\n";
echo "FIM DO DEBUG\n";
echo "========================================\n";
