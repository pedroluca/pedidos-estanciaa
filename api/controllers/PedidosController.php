<?php

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class PedidosController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll() {
        $data = $_GET['data'] ?? null;
        $status = $_GET['status'] ?? null;
        
        try {
            $sql = 'SELECT * FROM pedidos WHERE 1=1';
            $params = [];

            if ($data) {
                $sql .= ' AND data_agendamento = ?';
                $params[] = $data;
            }

            if ($status) {
                $sql .= ' AND status = ?';
                $params[] = $status;
            }

            $sql .= ' ORDER BY data_agendamento DESC, horario_agendamento DESC';

            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Busca os itens de cada pedido
            foreach ($pedidos as &$pedido) {
                $pedido['itens'] = $this->getItensPedido($pedido['id']);
            }

            Response::json($pedidos);
        } catch (Exception $e) {
            Response::error('Erro ao buscar pedidos: ' . $e->getMessage(), 500);
        }
    }

    public function getById($id) {
        try {
            $stmt = $this->db->prepare('SELECT * FROM pedidos WHERE id = ?');
            $stmt->execute([$id]);
            $pedido = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$pedido) {
                Response::error('Pedido não encontrado', 404);
            }

            $pedido['itens'] = $this->getItensPedido($pedido['id']);

            Response::json($pedido);
        } catch (Exception $e) {
            Response::error('Erro ao buscar pedido: ' . $e->getMessage(), 500);
        }
    }

    private function getItensPedido($pedidoId) {
        // Busca todos os itens do pedido
        $stmt = $this->db->prepare('
            SELECT pi.*, i.nome, i.imagem
            FROM pedidos_itens pi
            LEFT JOIN itens i ON pi.item_id = i.id
            WHERE pi.pedido_id = ?
        ');
        $stmt->execute([$pedidoId]);
        $todosItens = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Organiza em estrutura hierárquica
        return $this->buildItemHierarchy($todosItens);
    }

    private function buildItemHierarchy($items, $parentId = null) {
        $result = [];
        foreach ($items as $item) {
            $currentParentId = $item['parent_pedido_item_id'] ?? null;
            
            // Compara como string para evitar problemas de tipo (null == null, "1" == 1)
            if (($currentParentId === null && $parentId === null) || 
                ($currentParentId !== null && $parentId !== null && $currentParentId == $parentId)) {
                // Busca sub-itens deste item recursivamente
                $item['items'] = $this->buildItemHierarchy($items, $item['id']);
                $result[] = $item;
            }
        }
        return $result;
    }

    public function create() {
        Auth::authenticate();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['numero_pedido']) || !isset($data['nome_cliente']) || 
            !isset($data['data_agendamento']) || !isset($data['horario_agendamento']) ||
            !isset($data['itens']) || empty($data['itens'])) {
            Response::error('Dados incompletos', 400);
        }

        try {
            $this->db->beginTransaction();

            // Calcula o valor total
            $valorTotal = 0;
            foreach ($data['itens'] as $item) {
                $valorTotal += $item['preco_unitario'] * $item['quantidade'];
            }

            // Insere o pedido
            $stmt = $this->db->prepare('
                INSERT INTO pedidos (numero_pedido, nome_cliente, telefone_cliente, 
                    data_agendamento, horario_agendamento, status, tipo_entrega, 
                    endereco_entrega, observacoes, valor_total)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ');

            $stmt->execute([
                $data['numero_pedido'],
                $data['nome_cliente'],
                $data['telefone_cliente'] ?? null,
                $data['data_agendamento'],
                $data['horario_agendamento'],
                $data['status'] ?? 'Aguardando',
                $data['tipo_entrega'] ?? 'DELIVERY',
                $data['endereco_entrega'] ?? null,
                $data['observacoes'] ?? null,
                $valorTotal
            ]);

            $pedidoId = $this->db->lastInsertId();

            // Insere os itens do pedido
            $stmtItem = $this->db->prepare('
                INSERT INTO pedidos_itens (pedido_id, item_id, quantidade, preco_unitario, preco_total, observacoes)
                VALUES (?, ?, ?, ?, ?, ?)
            ');

            foreach ($data['itens'] as $item) {
                $precoTotal = $item['preco_unitario'] * $item['quantidade'];
                $stmtItem->execute([
                    $pedidoId,
                    $item['item_id'],
                    $item['quantidade'],
                    $item['preco_unitario'],
                    $precoTotal,
                    $item['observacoes'] ?? null
                ]);
            }

            $this->db->commit();

            // Busca o pedido criado
            $pedido = $this->db->prepare('SELECT * FROM pedidos WHERE id = ?');
            $pedido->execute([$pedidoId]);
            $pedidoCriado = $pedido->fetch(PDO::FETCH_ASSOC);
            $pedidoCriado['itens'] = $this->getItensPedido($pedidoId);

            Response::json($pedidoCriado, 201);
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Erro ao criar pedido: ' . $e->getMessage(), 500);
        }
    }

    public function update($id) {
        Auth::authenticate();
        
        $data = json_decode(file_get_contents('php://input'), true);
        
        try {
            // Verifica se o pedido existe
            $stmt = $this->db->prepare('SELECT id FROM pedidos WHERE id = ?');
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                Response::error('Pedido não encontrado', 404);
            }

            $this->db->beginTransaction();

            // Monta a query dinamicamente baseado nos campos fornecidos
            $fields = [];
            $params = [];
            $editouDataHorario = false;
            $editouStatus = false;

            if (isset($data['nome_cliente'])) {
                $fields[] = 'nome_cliente = ?';
                $params[] = $data['nome_cliente'];
            }
            if (isset($data['telefone_cliente'])) {
                $fields[] = 'telefone_cliente = ?';
                $params[] = $data['telefone_cliente'];
            }
            if (isset($data['data_agendamento'])) {
                $fields[] = 'data_agendamento = ?';
                $params[] = $data['data_agendamento'];
                $editouDataHorario = true;
            }
            if (isset($data['horario_agendamento'])) {
                $fields[] = 'horario_agendamento = ?';
                $params[] = $data['horario_agendamento'];
                $editouDataHorario = true;
            }
            if (isset($data['status'])) {
                $fields[] = 'status = ?';
                $params[] = $data['status'];
                $editouStatus = true;
            }
            if (isset($data['tipo_entrega'])) {
                $fields[] = 'tipo_entrega = ?';
                $params[] = $data['tipo_entrega'];
            }
            if (isset($data['endereco_entrega'])) {
                $fields[] = 'endereco_entrega = ?';
                $params[] = $data['endereco_entrega'];
            }
            if (isset($data['observacoes'])) {
                $fields[] = 'observacoes = ?';
                $params[] = $data['observacoes'];
            }

            // Marca como editado manualmente para proteger do polling
            if ($editouDataHorario) {
                $fields[] = 'editado_manualmente = 1';
            }
            if ($editouStatus) {
                $fields[] = 'status_editado_manualmente = 1';
            }
            $fields[] = 'data_atualizacao = NOW()';
            $params[] = $id;

            if (!empty($fields)) {
                $sql = 'UPDATE pedidos SET ' . implode(', ', $fields) . ' WHERE id = ?';
                $stmt = $this->db->prepare($sql);
                $stmt->execute($params);
            }

            // Atualiza itens se fornecidos
            if (isset($data['itens'])) {
                // Remove itens antigos
                $deleteStmt = $this->db->prepare('DELETE FROM pedidos_itens WHERE pedido_id = ?');
                $deleteStmt->execute([$id]);

                // Insere novos itens
                $valorTotal = 0;
                $stmtItem = $this->db->prepare('
                    INSERT INTO pedidos_itens (pedido_id, item_id, quantidade, preco_unitario, preco_total, observacoes)
                    VALUES (?, ?, ?, ?, ?, ?)
                ');

                foreach ($data['itens'] as $item) {
                    $precoTotal = $item['preco_unitario'] * $item['quantidade'];
                    $valorTotal += $precoTotal;
                    
                    $stmtItem->execute([
                        $id,
                        $item['item_id'],
                        $item['quantidade'],
                        $item['preco_unitario'],
                        $precoTotal,
                        $item['observacoes'] ?? null
                    ]);
                }

                // Atualiza valor total
                $updateTotal = $this->db->prepare('UPDATE pedidos SET valor_total = ? WHERE id = ?');
                $updateTotal->execute([$valorTotal, $id]);
            }

            $this->db->commit();

            // Retorna o pedido atualizado
            $stmt = $this->db->prepare('SELECT * FROM pedidos WHERE id = ?');
            $stmt->execute([$id]);
            $pedido = $stmt->fetch(PDO::FETCH_ASSOC);
            $pedido['itens'] = $this->getItensPedido($id);

            Response::json($pedido);
        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Erro ao atualizar pedido: ' . $e->getMessage(), 500);
        }
    }

    public function delete($id) {
        Auth::authenticate();
        
        try {
            $stmt = $this->db->prepare('SELECT id FROM pedidos WHERE id = ?');
            $stmt->execute([$id]);
            if (!$stmt->fetch()) {
                Response::error('Pedido não encontrado', 404);
            }

            $deleteStmt = $this->db->prepare('DELETE FROM pedidos WHERE id = ?');
            $deleteStmt->execute([$id]);

            Response::success(null, 'Pedido excluído com sucesso');
        } catch (Exception $e) {
            Response::error('Erro ao excluir pedido: ' . $e->getMessage(), 500);
        }
    }

    public function getPainel() {
        $data = $_GET['data'] ?? date('Y-m-d');
        
        try {
            // Busca pedidos do dia com status que devem aparecer no painel
            $stmt = $this->db->prepare('
                SELECT * FROM pedidos 
                WHERE data_agendamento = ? 
                AND status IN ("Aguardando", "Em Produção", "Agendado")
                ORDER BY horario_agendamento ASC
            ');
            $stmt->execute([$data]);
            $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Adiciona os itens com imagem para cada pedido
            foreach ($pedidos as &$pedido) {
                $pedido['itens'] = $this->getItensPedido($pedido['id']);
            }

            Response::json($pedidos);
        } catch (Exception $e) {
            Response::error('Erro ao buscar pedidos do painel: ' . $e->getMessage(), 500);
        }
    }
}
