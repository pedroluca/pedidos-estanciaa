#!/usr/bin/env php
<?php
/**
 * Cron Job - Polling Automático de Pedidos
 * 
 * Executa polling a cada 30 minutos para garantir que pedidos
 * sejam sincronizados mesmo com o painel fechado
 * 
 * Veja o arquivo README.md para instruções de configuração do cron
 */

// Ativa exibição de erros para debug
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "[" . date('Y-m-d H:i:s') . "] Script iniciado\n";

// Define o timezone
date_default_timezone_set('America/Sao_Paulo');

// Carrega variáveis de ambiente
$envFile = __DIR__ . '/../.env';
echo "[" . date('Y-m-d H:i:s') . "] Carregando .env de: {$envFile}\n";

if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($key, $value) = explode('=', $line, 2);
        $_ENV[trim($key)] = trim($value);
    }
    echo "[" . date('Y-m-d H:i:s') . "] .env carregado com sucesso\n";
} else {
    echo "[" . date('Y-m-d H:i:s') . "] ERRO: .env não encontrado!\n";
}

echo "[" . date('Y-m-d H:i:s') . "] Carregando Database.php\n";
require_once __DIR__ . '/../config/Database.php';
echo "[" . date('Y-m-d H:i:s') . "] Database.php carregado\n";

class AutoPoll {
    private $db;
    private $apiUrl;
    private $token;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
        $this->apiUrl = $_ENV['CARDAPIO_API_URL'] ?? 'https://integracao.cardapioweb.com';
        $this->token = $_ENV['CARDAPIO_API_TOKEN'] ?? '';
    }

    public function run() {
        $startTime = microtime(true);
        $this->log("========================================");
        $this->log("Iniciando polling automático");
        $this->log("Data/Hora: " . date('Y-m-d H:i:s'));

        if (empty($this->token)) {
            $this->log("ERRO: Token do Cardápio Web não configurado");
            return;
        }

        try {
            $result = $this->pollOrders();
            
            $duration = round(microtime(true) - $startTime, 2);
            $this->log("Polling concluído com sucesso");
            $this->log("Novos pedidos: {$result['novos']}");
            $this->log("Pedidos atualizados: {$result['atualizados']}");
            $this->log("Erros: " . count($result['erros']));
            if (!empty($result['erros'])) {
                foreach ($result['erros'] as $erro) {
                    $this->log("  - {$erro}");
                }
            }
            $this->log("Tempo de execução: {$duration}s");
        } catch (Exception $e) {
            $this->log("ERRO FATAL: " . $e->getMessage());
            $this->log("Stack trace: " . $e->getTraceAsString());
        }

        $this->log("========================================\n");
    }

    private function pollOrders() {
        // Busca lista de pedidos
        $ch = curl_init($this->apiUrl . '/api/partner/v1/orders');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'X-API-KEY: ' . $this->token,
            'Content-Type: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        curl_close($ch);

        if ($curlError) {
            throw new Exception("Erro cURL: {$curlError}");
        }

        if ($httpCode !== 200) {
            throw new Exception("Erro HTTP {$httpCode}: {$response}");
        }

        $orders = json_decode($response, true);
        
        if (!is_array($orders)) {
            throw new Exception("Resposta inválida da API");
        }

        $this->log("Total de pedidos retornados: " . count($orders));

        $this->db->beginTransaction();

        $novos = 0;
        $atualizados = 0;
        $erros = [];

        foreach ($orders as $orderBasic) {
            $orderId = $orderBasic['id'];
            
            try {
                // Busca detalhes completos do pedido
                $chDetail = curl_init($this->apiUrl . '/api/partner/v1/orders/' . $orderId);
                curl_setopt($chDetail, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($chDetail, CURLOPT_TIMEOUT, 30);
                curl_setopt($chDetail, CURLOPT_HTTPHEADER, [
                    'X-API-KEY: ' . $this->token,
                    'Content-Type: application/json'
                ]);
                
                $detailResponse = curl_exec($chDetail);
                $detailHttpCode = curl_getinfo($chDetail, CURLINFO_HTTP_CODE);
                $curlDetailError = curl_error($chDetail);
                curl_close($chDetail);

                if ($curlDetailError) {
                    $erros[] = "Pedido {$orderId}: Erro cURL - {$curlDetailError}";
                    continue;
                }

                if ($detailHttpCode !== 200) {
                    $erros[] = "Pedido {$orderId}: HTTP {$detailHttpCode}";
                    continue;
                }

                $order = json_decode($detailResponse, true);
                
                if (!$order) {
                    $erros[] = "Pedido {$orderId}: JSON inválido";
                    continue;
                }

                // Verifica se pedido já existe
                $stmt = $this->db->prepare("SELECT id, editado_manualmente, status_editado_manualmente FROM pedidos WHERE numero_pedido = ?");
                $stmt->execute([$orderId]);
                $existingOrder = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($existingOrder) {
                    // Atualiza apenas se não foi editado manualmente
                    $updated = $this->updateOrder($order, $existingOrder);
                    if ($updated) {
                        $atualizados++;
                    }
                } else {
                    // Insere novo pedido
                    $this->insertOrder($order);
                    $novos++;
                }
            } catch (Exception $e) {
                $erros[] = "Pedido {$orderId}: " . $e->getMessage();
            }
        }

        $this->db->commit();

        return [
            'novos' => $novos,
            'atualizados' => $atualizados,
            'erros' => $erros
        ];
    }

    private function insertOrder($order) {
        // Mapeia status
        $statusMap = [
            'pending' => 'Aguardando',
            'confirmed' => 'Agendado',
            'preparing' => 'Em Produção',
            'ready' => 'Esperando Retirada',
            'dispatched' => 'Saiu para Entrega',
            'delivered' => 'Finalizado',
            'cancelled' => 'Cancelado'
        ];
        
        $status = $statusMap[$order['status']] ?? 'Aguardando';

        // Extrai data e horário do agendamento
        $scheduledFor = $order['scheduled_for'] ?? $order['created_at'];
        $dateTime = new DateTime($scheduledFor);
        $dataAgendamento = $dateTime->format('Y-m-d');
        $horarioAgendamento = $dateTime->format('H:i:s');

        // Extrai nome do cliente (tratando customer como array)
        $nomeCliente = 'Cliente';
        $telefoneCliente = '';
        if (isset($order['customer'])) {
            if (is_array($order['customer'])) {
                $nomeCliente = $order['customer']['name'] ?? 'Cliente';
                $telefoneCliente = $order['customer']['phone'] ?? '';
            } elseif (is_string($order['customer'])) {
                $nomeCliente = $order['customer'];
            }
        }

        // Tipo de entrega
        $tipoEntrega = 'DELIVERY';
        if (isset($order['order_type'])) {
            $tipoEntrega = $order['order_type'] === 'takeout' ? 'RETIRADA' : 'DELIVERY';
        }

        // Endereço de entrega
        $enderecoEntrega = null;
        if (isset($order['delivery_address']) && is_array($order['delivery_address'])) {
            $addr = $order['delivery_address'];
            $partes = array_filter([
                $addr['street'] ?? '',
                isset($addr['number']) ? 'nº ' . $addr['number'] : '',
                $addr['neighborhood'] ?? '',
                $addr['city'] ?? '',
                $addr['state'] ?? ''
            ]);
            $enderecoEntrega = implode(', ', $partes);
        }

        // Insere pedido
        $stmt = $this->db->prepare("
            INSERT INTO pedidos (
                numero_pedido, nome_cliente, telefone_cliente, 
                data_agendamento, horario_agendamento, status, 
                tipo_entrega, endereco_entrega, observacoes, 
                valor_total
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ");

        $observacoes = trim(($order['notes'] ?? '') . "\n" . ($order['delivery_notes'] ?? ''));
        
        $stmt->execute([
            $order['id'],
            $nomeCliente,
            $telefoneCliente,
            $dataAgendamento,
            $horarioAgendamento,
            $status,
            $tipoEntrega,
            $enderecoEntrega,
            $observacoes ?: null,
            $order['total'] ?? 0
        ]);

        $pedidoId = $this->db->lastInsertId();

        // Insere itens
        if (isset($order['items']) && is_array($order['items'])) {
            foreach ($order['items'] as $item) {
                $this->insertOrderItem($pedidoId, $item);
            }
        }
    }

    private function insertOrderItem($pedidoId, $item) {
        // Busca item_id pelo nome (se existir no catálogo)
        $stmt = $this->db->prepare("SELECT id FROM itens WHERE nome = ? LIMIT 1");
        $stmt->execute([$item['name']]);
        $catalogItem = $stmt->fetch(PDO::FETCH_ASSOC);

        $stmt = $this->db->prepare("
            INSERT INTO pedido_itens (
                pedido_id, item_id, nome, quantidade, 
                preco_unitario, observacoes
            ) VALUES (?, ?, ?, ?, ?, ?)
        ");

        $stmt->execute([
            $pedidoId,
            $catalogItem['id'] ?? null,
            $item['name'],
            $item['quantity'] ?? 1,
            $item['price'] ?? 0,
            $item['notes'] ?? null
        ]);
    }

    private function updateOrder($order, $existingOrder) {
        $editadoManualmente = (bool)$existingOrder['editado_manualmente'];
        $statusEditadoManualmente = (bool)$existingOrder['status_editado_manualmente'];

        // Mapeia status
        $statusMap = [
            'pending' => 'Aguardando',
            'confirmed' => 'Agendado',
            'preparing' => 'Em Produção',
            'ready' => 'Esperando Retirada',
            'dispatched' => 'Saiu para Entrega',
            'delivered' => 'Finalizado',
            'cancelled' => 'Cancelado'
        ];
        
        $novoStatus = $statusMap[$order['status']] ?? 'Aguardando';

        // Extrai data e horário
        $scheduledFor = $order['scheduled_for'] ?? $order['created_at'];
        $dateTime = new DateTime($scheduledFor);
        $dataAgendamento = $dateTime->format('Y-m-d');
        $horarioAgendamento = $dateTime->format('H:i:s');

        // Determina quais campos atualizar
        if (!$editadoManualmente && !$statusEditadoManualmente) {
            // Extrai nome do cliente (tratando customer como array)
            $nomeCliente = 'Cliente';
            $telefoneCliente = '';
            if (isset($order['customer'])) {
                if (is_array($order['customer'])) {
                    $nomeCliente = $order['customer']['name'] ?? 'Cliente';
                    $telefoneCliente = $order['customer']['phone'] ?? '';
                } elseif (is_string($order['customer'])) {
                    $nomeCliente = $order['customer'];
                }
            }

            // Tipo de entrega
            $tipoEntrega = 'DELIVERY';
            if (isset($order['order_type'])) {
                $tipoEntrega = $order['order_type'] === 'takeout' ? 'RETIRADA' : 'DELIVERY';
            }

            // Endere\u00e7o de entrega
            $enderecoEntrega = null;
            if (isset($order['delivery_address']) && is_array($order['delivery_address'])) {
                $addr = $order['delivery_address'];
                $partes = array_filter([
                    $addr['street'] ?? '',
                    isset($addr['number']) ? 'n\u00ba ' . $addr['number'] : '',
                    $addr['neighborhood'] ?? '',
                    $addr['city'] ?? '',
                    $addr['state'] ?? ''
                ]);
                $enderecoEntrega = implode(', ', $partes);
            }

            // Atualiza tudo
            $stmt = $this->db->prepare("
                UPDATE pedidos SET
                    nome_cliente = ?,
                    telefone_cliente = ?,
                    data_agendamento = ?,
                    horario_agendamento = ?,
                    status = ?,
                    tipo_entrega = ?,
                    endereco_entrega = ?,
                    observacoes = ?,
                    valor_total = ?
                WHERE id = ?
            ");

            $observacoes = trim(($order['notes'] ?? '') . "\n" . ($order['delivery_notes'] ?? ''));

            $stmt->execute([
                $nomeCliente,
                $telefoneCliente,
                $dataAgendamento,
                $horarioAgendamento,
                $novoStatus,
                $tipoEntrega,
                $enderecoEntrega,
                $observacoes ?: null,
                $order['total'] ?? 0,
                $existingOrder['id']
            ]);

            return true;
        } elseif ($editadoManualmente && !$statusEditadoManualmente) {
            // Atualiza apenas status
            $stmt = $this->db->prepare("
                UPDATE pedidos SET
                    status = ?
                WHERE id = ?
            ");

            $stmt->execute([
                $novoStatus,
                $existingOrder['id']
            ]);

            return true;
        } elseif (!$editadoManualmente && $statusEditadoManualmente) {
            // Extrai nome do cliente (tratando customer como array)
            $nomeCliente = 'Cliente';
            $telefoneCliente = '';
            if (isset($order['customer'])) {
                if (is_array($order['customer'])) {
                    $nomeCliente = $order['customer']['name'] ?? 'Cliente';
                    $telefoneCliente = $order['customer']['phone'] ?? '';
                } elseif (is_string($order['customer'])) {
                    $nomeCliente = $order['customer'];
                }
            }

            // Tipo de entrega
            $tipoEntrega = 'DELIVERY';
            if (isset($order['order_type'])) {
                $tipoEntrega = $order['order_type'] === 'takeout' ? 'RETIRADA' : 'DELIVERY';
            }

            // Endere\u00e7o de entrega
            $enderecoEntrega = null;
            if (isset($order['delivery_address']) && is_array($order['delivery_address'])) {
                $addr = $order['delivery_address'];
                $partes = array_filter([
                    $addr['street'] ?? '',
                    isset($addr['number']) ? 'n\u00ba ' . $addr['number'] : '',
                    $addr['neighborhood'] ?? '',
                    $addr['city'] ?? '',
                    $addr['state'] ?? ''
                ]);
                $enderecoEntrega = implode(', ', $partes);
            }

            // Atualiza tudo EXCETO status
            $stmt = $this->db->prepare("
                UPDATE pedidos SET
                    nome_cliente = ?,
                    telefone_cliente = ?,
                    data_agendamento = ?,
                    horario_agendamento = ?,
                    tipo_entrega = ?,
                    endereco_entrega = ?,
                    observacoes = ?,
                    valor_total = ?
                WHERE id = ?
            ");

            $observacoes = trim(($order['notes'] ?? '') . "\n" . ($order['delivery_notes'] ?? ''));

            $stmt->execute([
                $nomeCliente,
                $telefoneCliente,
                $dataAgendamento,
                $horarioAgendamento,
                $tipoEntrega,
                $enderecoEntrega,
                $observacoes ?: null,
                $order['total'] ?? 0,
                $existingOrder['id']
            ]);

            return true;
        }

        // Se ambos editados manualmente, não atualiza nada
        return false;
    }

    private function log($message) {
        echo "[" . date('Y-m-d H:i:s') . "] " . $message . "\n";
    }
}

// Executa o polling
$autoPoll = new AutoPoll();
$autoPoll->run();
