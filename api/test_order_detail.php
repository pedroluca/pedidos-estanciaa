<?php
// Script de teste para verificar endpoint de detalhes de pedido

$orderId = '149739758'; // ID de um pedido recente
$token = '3swop3XGaLQz6M134TcJdPpqoHN8ZtJhYfLD9PH9';

// Busca detalhes de um pedido específico
$ch = curl_init("https://integracao.cardapioweb.com/api/partner/v1/orders/{$orderId}");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-KEY: ' . $token,
    'Content-Type: application/json'
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
curl_close($ch);

echo "HTTP Code: {$httpCode}\n";
if ($error) {
    echo "cURL Error: {$error}\n";
}
echo "Response:\n";
echo json_encode(json_decode($response), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);


