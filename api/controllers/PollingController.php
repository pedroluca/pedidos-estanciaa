<?php

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/Response.php';

class PollingController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function pollOrders() {
        $apiUrl = $_ENV['CARDAPIO_API_URL'] ?? 'https://integracao.cardapioweb.com';
        $token = $_ENV['CARDAPIO_API_TOKEN'] ?? '';

        if (empty($token)) {
            Response::error('Token do Cardápio Web não configurado', 500);
        }

        try {
            // Busca pedidos da API do Cardápio Web
            $ch = curl_init($apiUrl . '/api/partner/v1/orders');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'X-API-KEY: ' . $token,
                'Content-Type: application/json'
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                Response::error('Erro ao buscar pedidos do Cardápio Web: ' . $response, 500);
            }

            $data = json_decode($response, true);
            
            if (!isset($data['orders']) && !is_array($data)) {
                Response::error('Formato de resposta inválido', 500);
            }

            // Se a resposta for direto um array de pedidos
            $orders = isset($data['orders']) ? $data['orders'] : $data;

            $this->db->beginTransaction();

            $novos = 0;
            $atualizados = 0;

            foreach ($orders as $order) {
                $numeroPedido = $order['order_number'] ?? $order['id'] ?? null;
                
                if (!$numeroPedido) continue;

                // Verifica se o pedido já existe
                $stmt = $this->db->prepare('SELECT id, status, data_atualizacao FROM pedidos WHERE numero_pedido = ?');
                $stmt->execute([$numeroPedido]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$existing) {
                    // Pedido novo - insere
                    $this->insertOrder($order);
                    $novos++;
                } else {
                    // Pedido existe - verifica se houve mudanças
                    $statusNovo = $this->mapStatus($order['status'] ?? 'pending');
                    
                    if ($existing['status'] !== $statusNovo || $this->hasItemChanges($existing['id'], $order['items'] ?? [])) {
                        $this->updateOrder($existing['id'], $order);
                        $atualizados++;
                    }
                }
            }

            $this->db->commit();

            Response::json([
                'success' => true,
                'novos' => $novos,
                'atualizados' => $atualizados,
                'total' => count($orders)
            ]);

        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Erro no polling: ' . $e->getMessage(), 500);
        }
    }

    private function insertOrder($order) {
        $stmt = $this->db->prepare('
            INSERT INTO pedidos (
                numero_pedido, nome_cliente, telefone_cliente, 
                data_agendamento, horario_agendamento, status, 
                tipo_entrega, endereco_entrega, observacoes, valor_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');

        $numeroPedido = $order['order_number'] ?? $order['id'];
        $nomeCliente = $order['customer_name'] ?? $order['client']['name'] ?? 'Cliente';
        $telefone = $order['customer_phone'] ?? $order['client']['phone'] ?? '';
        $dataAgendamento = $order['scheduled_date'] ?? date('Y-m-d');
        $horario = $order['scheduled_time'] ?? date('H:i:s');
        $status = $this->mapStatus($order['status'] ?? 'pending');
        $tipoEntrega = ($order['delivery_type'] ?? 'delivery') === 'pickup' ? 'RETIRADA' : 'DELIVERY';
        $endereco = $order['delivery_address'] ?? '';
        $observacoes = $order['notes'] ?? '';
        $valorTotal = $order['total'] ?? 0;

        $stmt->execute([
            $numeroPedido,
            $nomeCliente,
            $telefone,
            $dataAgendamento,
            $horario,
            $status,
            $tipoEntrega,
            $endereco,
            $observacoes,
            $valorTotal
        ]);

        $pedidoId = $this->db->lastInsertId();

        // Insere itens do pedido
        if (isset($order['items']) && is_array($order['items'])) {
            foreach ($order['items'] as $item) {
                $this->insertOrderItem($pedidoId, $item);
            }
        }
    }

    private function updateOrder($pedidoId, $order) {
        $stmt = $this->db->prepare('
            UPDATE pedidos SET 
                status = ?,
                observacoes = ?,
                valor_total = ?,
                data_atualizacao = NOW()
            WHERE id = ?
        ');

        $status = $this->mapStatus($order['status'] ?? 'pending');
        $observacoes = $order['notes'] ?? '';
        $valorTotal = $order['total'] ?? 0;

        $stmt->execute([$status, $observacoes, $valorTotal, $pedidoId]);

        // Remove itens antigos e reinsere
        $stmt = $this->db->prepare('DELETE FROM pedidos_itens WHERE pedido_id = ?');
        $stmt->execute([$pedidoId]);

        if (isset($order['items']) && is_array($order['items'])) {
            foreach ($order['items'] as $item) {
                $this->insertOrderItem($pedidoId, $item);
            }
        }
    }

    private function insertOrderItem($pedidoId, $item) {
        // Tenta encontrar o item pelo nome
        $itemId = $item['item_id'] ?? null;
        
        if (!$itemId) {
            $nome = $item['name'] ?? $item['product_name'] ?? '';
            $stmt = $this->db->prepare('SELECT id FROM itens WHERE nome LIKE ? LIMIT 1');
            $stmt->execute(['%' . $nome . '%']);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $itemId = $result ? $result['id'] : 0;
        }

        if (!$itemId) return; // Skip se não encontrar o item

        $stmt = $this->db->prepare('
            INSERT INTO pedidos_itens (
                pedido_id, item_id, quantidade, 
                preco_unitario, preco_total, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?)
        ');

        $quantidade = $item['quantity'] ?? 1;
        $precoUnitario = $item['unit_price'] ?? $item['price'] ?? 0;
        $precoTotal = $quantidade * $precoUnitario;
        $obs = $item['notes'] ?? '';

        $stmt->execute([
            $pedidoId,
            $itemId,
            $quantidade,
            $precoUnitario,
            $precoTotal,
            $obs
        ]);
    }

    private function hasItemChanges($pedidoId, $newItems) {
        $stmt = $this->db->prepare('SELECT COUNT(*) as total FROM pedidos_itens WHERE pedido_id = ?');
        $stmt->execute([$pedidoId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        return $result['total'] != count($newItems);
    }

    private function mapStatus($apiStatus) {
        $statusMap = [
            'pending' => 'Aguardando',
            'confirmed' => 'Agendado',
            'preparing' => 'Em Produção',
            'ready' => 'Esperando Retirada',
            'delivering' => 'Saiu para Entrega',
            'delivered' => 'Finalizado',
            'cancelled' => 'Cancelado'
        ];

        return $statusMap[$apiStatus] ?? 'Aguardando';
    }
}
