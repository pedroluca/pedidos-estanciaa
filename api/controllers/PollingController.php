<?php

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/Response.php';

class PollingController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    // Endpoint de debug para ver a resposta bruta da API
    public function debugApiResponse() {
        $apiUrl = $_ENV['CARDAPIO_API_URL'] ?? 'https://integracao.cardapioweb.com';
        $token = $_ENV['CARDAPIO_API_TOKEN'] ?? '';

        if (empty($token)) {
            Response::error('Token do Cardápio Web não configurado', 500);
        }

        try {
            // Testa API de Catálogo
            $chCatalog = curl_init($apiUrl . '/api/partner/v1/catalog');
            curl_setopt($chCatalog, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($chCatalog, CURLOPT_HTTPHEADER, [
                'X-API-KEY: ' . $token,
                'Content-Type: application/json'
            ]);
            $responseCatalog = curl_exec($chCatalog);
            $httpCodeCatalog = curl_getinfo($chCatalog, CURLINFO_HTTP_CODE);
            curl_close($chCatalog);

            // Testa API de Pedidos
            $chOrders = curl_init($apiUrl . '/api/partner/v1/orders');
            curl_setopt($chOrders, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($chOrders, CURLOPT_HTTPHEADER, [
                'X-API-KEY: ' . $token,
                'Content-Type: application/json'
            ]);
            $responseOrders = curl_exec($chOrders);
            $httpCodeOrders = curl_getinfo($chOrders, CURLINFO_HTTP_CODE);
            curl_close($chOrders);

            Response::json([
                'catalog' => [
                    'http_code' => $httpCodeCatalog,
                    'data' => json_decode($responseCatalog, true)
                ],
                'orders' => [
                    'http_code' => $httpCodeOrders,
                    'data' => json_decode($responseOrders, true)
                ]
            ]);
        } catch (Exception $e) {
            Response::error('Erro ao testar API: ' . $e->getMessage(), 500);
        }
    }

    // Endpoint de debug para testar um pedido específico
    public function testOrderMapping() {
        $apiUrl = $_ENV['CARDAPIO_API_URL'] ?? 'https://integracao.cardapioweb.com';
        $token = $_ENV['CARDAPIO_API_TOKEN'] ?? '';

        // Pega um pedido recente da lista
        $ch = curl_init($apiUrl . '/api/partner/v1/orders');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-KEY: ' . $token,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        curl_close($ch);
        
        $orders = json_decode($response, true);
        if (!is_array($orders) || empty($orders)) {
            Response::error('Nenhum pedido encontrado', 404);
        }

        $firstOrderId = $orders[0]['id'];

        // Busca detalhes do primeiro pedido
        $chDetail = curl_init($apiUrl . '/api/partner/v1/orders/' . $firstOrderId);
        curl_setopt($chDetail, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($chDetail, CURLOPT_HTTPHEADER, [
            'X-API-KEY: ' . $token,
            'Content-Type: application/json'
        ]);
        
        $detailResponse = curl_exec($chDetail);
        $detailHttpCode = curl_getinfo($chDetail, CURLINFO_HTTP_CODE);
        curl_close($chDetail);

        $order = json_decode($detailResponse, true);

        // Mostra o mapeamento
        $mapped = [
            'raw_api_response' => $order,
            'mapped_data' => [
                'numero_pedido' => $order['display_id'] ?? $order['id'] ?? '',
                'id_interno_api' => $order['id'] ?? '',
                'nome_cliente' => $order['customer']['name'] ?? 'Cliente',
                'telefone_cliente' => $order['customer']['phone'] ?? '',
                'schedule' => $order['schedule'] ?? null,
                'created_at' => $order['created_at'] ?? null,
                'status' => $order['status'] ?? '',
                'order_type' => $order['order_type'] ?? '',
                'delivery_address' => $order['delivery_address'] ?? null,
                'observation' => $order['observation'] ?? '',
                'total' => $order['total'] ?? 0,
                'items_count' => count($order['items'] ?? []),
                'items_sample' => array_slice($order['items'] ?? [], 0, 2)
            ]
        ];

        Response::json($mapped);
    }

    public function pollOrders() {
        $apiUrl = $_ENV['CARDAPIO_API_URL'] ?? 'https://integracao.cardapioweb.com';
        $token = $_ENV['CARDAPIO_API_TOKEN'] ?? '';

        if (empty($token)) {
            Response::error('Token do Cardápio Web não configurado', 500);
        }

        try {
            // Busca lista de pedidos
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

            $orders = json_decode($response, true);
            
            if (!is_array($orders)) {
                Response::error('Formato de resposta inválido', 500);
            }

            $this->db->beginTransaction();

            $novos = 0;
            $atualizados = 0;
            $erros = [];

            foreach ($orders as $orderBasic) {
                $orderId = $orderBasic['id'];
                
                // Busca detalhes completos do pedido
                $chDetail = curl_init($apiUrl . '/api/partner/v1/orders/' . $orderId);
                curl_setopt($chDetail, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($chDetail, CURLOPT_HTTPHEADER, [
                    'X-API-KEY: ' . $token,
                    'Content-Type: application/json'
                ]);
                
                $detailResponse = curl_exec($chDetail);
                $detailHttpCode = curl_getinfo($chDetail, CURLINFO_HTTP_CODE);
                curl_close($chDetail);

                if ($detailHttpCode !== 200) {
                    $erros[] = "Pedido {$orderId}: Erro HTTP {$detailHttpCode}";
                    continue;
                }

                $order = json_decode($detailResponse, true);
                
                if (!$order) {
                    $erros[] = "Pedido {$orderId}: JSON inválido";
                    continue;
                }

                // Usa display_id ao invés de id para mostrar ao usuário
                $numeroPedido = $order['display_id'] ?? $order['id'] ?? $orderId;
                
                // Verifica se o pedido já existe
                $stmt = $this->db->prepare('SELECT id, status, editado_manualmente FROM pedidos WHERE numero_pedido = ?');
                $stmt->execute([$numeroPedido]);
                $existing = $stmt->fetch(PDO::FETCH_ASSOC);

                try {
                    if (!$existing) {
                        // Pedido novo - insere
                        $this->insertOrder($order);
                        $novos++;
                    } else {
                        // Pula atualização se o pedido foi editado manualmente
                        if ($existing['editado_manualmente'] == 1) {
                            continue;
                        }
                        
                        // Pedido existe - verifica se status mudou OU se itens mudaram
                        $statusNovo = $this->mapStatus($order['status'] ?? 'pending');
                        $itensMudaram = $this->verificarMudancaItens($existing['id'], $order['items'] ?? []);
                        
                        if ($existing['status'] !== $statusNovo || $itensMudaram) {
                            $this->updateOrder($existing['id'], $order);
                            $atualizados++;
                        }
                    }
                } catch (Exception $e) {
                    $erros[] = "Pedido {$orderId}: {$e->getMessage()}";
                }
            }

            $this->db->commit();

            Response::json([
                'success' => true,
                'novos' => $novos,
                'atualizados' => $atualizados,
                'total' => count($orders),
                'erros' => $erros
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

        // Mapeamento baseado na estrutura real da API Cardápio Web
        // Usa display_id (número amigável) ao invés de id (UUID interno)
        $numeroPedido = $order['display_id'] ?? $order['id'] ?? '';
        $nomeCliente = $order['customer']['name'] ?? 'Cliente';
        $telefone = $order['customer']['phone'] ?? '';
        
        // Data e horário: usa schedule se for pedido agendado, senão usa created_at
        $apiStatus = $order['status'] ?? 'pending';
        $schedule = $order['schedule'] ?? null;
        
        // Se o status for scheduled_confirmed, SEMPRE usa a data do schedule
        if ($apiStatus === 'scheduled_confirmed' && $schedule && isset($schedule['scheduled_date_time_start'])) {
            // Parse com timezone para evitar conversão incorreta
            $dateTime = new DateTime($schedule['scheduled_date_time_start']);
            $dataAgendamento = $dateTime->format('Y-m-d');
            $horario = $dateTime->format('H:i:s');
        } else {
            // Para outros status, usa a data de criação
            $createdAt = $order['created_at'] ?? null;
            if ($createdAt) {
                $dateTime = new DateTime($createdAt);
                $dataAgendamento = $dateTime->format('Y-m-d');
                $horario = $dateTime->format('H:i:s');
            } else {
                $dataAgendamento = date('Y-m-d');
                $horario = date('H:i:s');
            }
        }
        
        $status = $this->mapStatus($apiStatus);
        $tipoEntrega = ($order['order_type'] ?? 'delivery') === 'takeout' ? 'RETIRADA' : 'DELIVERY';
        
        // Endereço de entrega
        $endereco = '';
        if (isset($order['delivery_address']) && $order['delivery_address']) {
            $addr = $order['delivery_address'];
            $partes = array_filter([
                $addr['street'] ?? '',
                isset($addr['number']) ? 'nº ' . $addr['number'] : '',
                $addr['neighborhood'] ?? '',
                $addr['city'] ?? '',
                isset($addr['state']) ? $addr['state'] : ''
            ]);
            $endereco = implode(', ', $partes);
        }
        
        $observacoes = $order['observation'] ?? '';
        
        // Usa o valor total já calculado pela API
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

    private function verificarMudancaItens($pedidoId, $novosItens) {
        // Busca itens atuais do pedido
        $stmt = $this->db->prepare('
            SELECT item_id, quantidade 
            FROM pedidos_itens 
            WHERE pedido_id = ?
            ORDER BY item_id
        ');
        $stmt->execute([$pedidoId]);
        $itensAtuais = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Cria arrays para comparação - usar item_id da API
        $idsAtuais = [];
        $quantidadesAtuais = [];
        foreach ($itensAtuais as $item) {
            $idsAtuais[] = $item['item_id'];
            $quantidadesAtuais[$item['item_id']] = $item['quantidade'];
        }

        $idsNovos = [];
        $quantidadesNovas = [];
        foreach ($novosItens as $item) {
            // Ignora itens cancelados na comparação
            if ($this->isItemCancelled($item)) {
                continue;
            }
            
            $itemId = $item['item_id'] ?? null;
            if ($itemId) {
                $idsNovos[] = $itemId;
                $quantidadesNovas[$itemId] = $item['quantity'] ?? 1;
            }
        }

        sort($idsAtuais);
        sort($idsNovos);

        // Verifica se a lista de IDs é diferente
        if ($idsAtuais !== $idsNovos) {
            return true;
        }

        // Verifica se as quantidades mudaram
        foreach ($idsNovos as $id) {
            if (!isset($quantidadesAtuais[$id]) || 
                $quantidadesAtuais[$id] != $quantidadesNovas[$id]) {
                return true;
            }
        }

        return false;
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
        $observacoes = $order['observation'] ?? '';
        $valorTotal = $order['total'] ?? 0;

        $stmt->execute([$status, $observacoes, $valorTotal, $pedidoId]);

        // Remove itens antigos e reinsere
        $stmt = $this->db->prepare('DELETE FROM pedidos_itens WHERE pedido_id = ?');
        $stmt->execute([$pedidoId]);

        if (isset($order['items']) && is_array($order['items'])) {
            foreach ($order['items'] as $item) {
                // Ignora itens cancelados
                if ($this->isItemCancelled($item)) {
                    continue;
                }
                $this->insertOrderItem($pedidoId, $item);
            }
        }
    }

    private function isItemCancelled($item) {
        // Verifica se o item foi cancelado/deletado
        // A API pode usar diferentes campos para indicar cancelamento
        
        // Verifica campo 'status'
        if (isset($item['status'])) {
            $cancelledStatuses = ['canceled'];
            if (in_array(strtolower($item['status']), $cancelledStatuses)) {
                return true;
            }
        }
        
        return false;
    }

    private function insertOrderItem($pedidoId, $item) {
        // Tenta encontrar o item pelo ID da API ou pelo nome
        $apiItemId = $item['item_id'] ?? null;
        $itemId = null;
        
        if ($apiItemId) {
            // Busca pelo ID da API (assumindo que foi salvo no campo id da tabela itens)
            $stmt = $this->db->prepare('SELECT id FROM itens WHERE id = ?');
            $stmt->execute([$apiItemId]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $itemId = $result ? $result['id'] : null;
        }
        
        if (!$itemId) {
            // Busca pelo nome do item
            $nome = $item['name'] ?? '';
            $stmt = $this->db->prepare('SELECT id FROM itens WHERE nome LIKE ? LIMIT 1');
            $stmt->execute(['%' . $nome . '%']);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            $itemId = $result ? $result['id'] : null;
        }

        if (!$itemId) return; // Skip se não encontrar o item

        $stmt = $this->db->prepare('
            INSERT INTO pedidos_itens (
                pedido_id, item_id, quantidade, 
                preco_unitario, preco_total, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?)
        ');

        $quantidade = $item['quantity'] ?? 1;
        $precoUnitario = $item['unit_price'] ?? 0;
        $precoTotal = $item['total_price'] ?? ($quantidade * $precoUnitario);
        $obs = $item['observation'] ?? '';

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
            'waiting_confirmation' => 'Aguardando',
            'pending_payment' => 'Pagamento Pendente',
            'pending_online_payment' => 'Pagamento Online Pendente',
            'scheduled_confirmed' => 'Agendado',
            'confirmed' => 'Em Produção',
            'ready' => 'Em Produção',
            'waiting_to_catch' => 'Esperando Retirada',
            'released' => 'Saiu para Entrega',
            'closed' => 'Finalizado'
        ];

        return $statusMap[$apiStatus] ?? 'Aguardando';
    }
}
