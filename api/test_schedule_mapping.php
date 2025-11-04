<?php
// Script de teste para verificar mapeamento de datas de pedidos agendados

$token = '3swop3XGaLQz6M134TcJdPpqoHN8ZtJhYfLD9PH9';

// Busca lista de pedidos
$ch = curl_init("https://integracao.cardapioweb.com/api/partner/v1/orders");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-KEY: ' . $token,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$orders = json_decode($response, true);

echo "=== PEDIDOS AGENDADOS ===\n\n";

foreach ($orders as $orderBasic) {
    // Busca detalhes do pedido
    $ch = curl_init("https://integracao.cardapioweb.com/api/partner/v1/orders/{$orderBasic['id']}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-KEY: ' . $token,
        'Content-Type: application/json'
    ]);
    
    $detailResponse = curl_exec($ch);
    curl_close($ch);
    
    $order = json_decode($detailResponse, true);
    
    if (!$order) continue;
    
    $status = $order['status'] ?? '';
    $displayId = $order['display_id'] ?? $order['id'] ?? '';
    
    // Mostra apenas pedidos agendados
    if ($status === 'scheduled_confirmed') {
        echo "Pedido #{$displayId}\n";
        echo "Status: {$status}\n";
        echo "Created At: {$order['created_at']}\n";
        
        if (isset($order['schedule'])) {
            echo "Schedule:\n";
            echo "  - scheduled_date_time_start: {$order['schedule']['scheduled_date_time_start']}\n";
            if (isset($order['schedule']['scheduled_date_time_end'])) {
                echo "  - scheduled_date_time_end: {$order['schedule']['scheduled_date_time_end']}\n";
            }
            
            // Testa o parsing com DateTime (correto)
            $scheduledDateTime = $order['schedule']['scheduled_date_time_start'];
            $dt = new DateTime($scheduledDateTime);
            $dataAgendamento = $dt->format('Y-m-d');
            $horario = $dt->format('H:i:s');
            
            echo "\nParsed (DateTime):\n";
            echo "  - Data: {$dataAgendamento} (" . $dt->format('d/m/Y') . ")\n";
            echo "  - Horário: {$horario}\n";
        } else {
            echo "⚠️  SEM SCHEDULE!\n";
        }
        
        echo "\n" . str_repeat("-", 50) . "\n\n";
    }
}

echo "\n=== TODOS OS STATUS ===\n\n";

// Reseta o ponteiro
$ch = curl_init("https://integracao.cardapioweb.com/api/partner/v1/orders");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-KEY: ' . $token,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
curl_close($ch);

$orders = json_decode($response, true);
$statusCount = [];

foreach ($orders as $orderBasic) {
    $ch = curl_init("https://integracao.cardapioweb.com/api/partner/v1/orders/{$orderBasic['id']}");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'X-API-KEY: ' . $token,
        'Content-Type: application/json'
    ]);
    
    $detailResponse = curl_exec($ch);
    curl_close($ch);
    
    $order = json_decode($detailResponse, true);
    if (!$order) continue;
    
    $status = $order['status'] ?? 'unknown';
    $displayId = $order['display_id'] ?? substr($order['id'], 0, 8);
    
    if (!isset($statusCount[$status])) {
        $statusCount[$status] = [];
    }
    $statusCount[$status][] = "#{$displayId}";
}

foreach ($statusCount as $status => $pedidos) {
    echo "{$status}: " . count($pedidos) . " pedidos\n";
    echo "  " . implode(", ", array_slice($pedidos, 0, 5));
    if (count($pedidos) > 5) {
        echo " ... (+" . (count($pedidos) - 5) . " mais)";
    }
    echo "\n\n";
}
