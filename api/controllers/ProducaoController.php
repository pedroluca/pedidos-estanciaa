<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class ProducaoController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Marca um pedido como feito ou desfaz a marcação
     * POST /api/producao/toggle
     * Body: { "pedido_id": 123 }
     */
    public function toggleFeito() {
        // Verifica autenticação
        Auth::authenticate();

        // Lê o corpo da requisição
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['pedido_id'])) {
            Response::error('ID do pedido não fornecido', 400);
            return;
        }

        $pedidoId = $data['pedido_id'];

        try {
            // Busca o pedido atual
            $stmt = $this->db->prepare("SELECT is_feito FROM pedidos WHERE id = ?");
            $stmt->execute([$pedidoId]);
            $pedido = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$pedido) {
                Response::error('Pedido não encontrado', 404);
                return;
            }

            // Inverte o status
            $novoStatus = $pedido['is_feito'] ? 0 : 1;

            // Atualiza no banco
            $stmt = $this->db->prepare("UPDATE pedidos SET is_feito = ? WHERE id = ?");
            $stmt->execute([$novoStatus, $pedidoId]);

            Response::success([
                'pedido_id' => $pedidoId,
                'is_feito' => $novoStatus
            ], 'Status de produção atualizado com sucesso');

        } catch (PDOException $e) {
            Response::error('Erro ao atualizar status: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtém todos os pedidos com seus status de produção para uma data específica
     * GET /api/producao/painel?data=2025-11-05
     */
    public function getPainelProducao() {
        // Verifica autenticação
        Auth::authenticate();

        // Pega a data da query string (se não informada, usa hoje)
        $data = isset($_GET['data']) ? $_GET['data'] : date('Y-m-d');

        try {
            $query = "
                SELECT 
                    p.id,
                    p.numero_pedido,
                    p.nome_cliente,
                    p.data_agendamento,
                    p.horario_agendamento,
                    p.status,
                    p.is_feito,
                    p.observacoes,
                    p.tipo_entrega,
                    p.valor_total
                FROM pedidos p
                WHERE p.data_agendamento = ?
                AND p.status IN ('Agendado', 'Em Produção')
                ORDER BY p.horario_agendamento ASC
            ";

            $stmt = $this->db->prepare($query);
            $stmt->execute([$data]);
            $pedidos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Para cada pedido, busca os itens
            foreach ($pedidos as &$pedido) {
                $stmtItens = $this->db->prepare("
                    SELECT 
                        pi.quantidade,
                        pi.observacoes,
                        i.nome,
                        i.imagem
                    FROM pedidos_itens pi
                    JOIN itens i ON pi.item_id = i.id
                    WHERE pi.pedido_id = ?
                ");
                $stmtItens->execute([$pedido['id']]);
                $pedido['itens'] = $stmtItens->fetchAll(PDO::FETCH_ASSOC);
                
                // Converte is_feito para boolean
                $pedido['is_feito'] = (bool)$pedido['is_feito'];
            }

            Response::json($pedidos);

        } catch (PDOException $e) {
            Response::error('Erro ao buscar pedidos: ' . $e->getMessage(), 500);
        }
    }
}
