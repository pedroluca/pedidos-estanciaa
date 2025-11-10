<?php
require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class EstoqueController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    /**
     * Lista produtos perecíveis do estoque com filtros
     * GET /api/estoque?filtro=7dias|semana|mes|mes_proximo|periodo&data_inicio=YYYY-MM-DD&data_fim=YYYY-MM-DD
     */
    public function listar() {
        Auth::authenticate();

        $filtro = $_GET['filtro'] ?? '7dias';
        $dataInicio = $_GET['data_inicio'] ?? null;
        $dataFim = $_GET['data_fim'] ?? null;

        try {
            $hoje = date('Y-m-d');
            $query = "
                SELECT 
                    ep.*,
                    i.imagem
                FROM estoque_pereciveis ep
                LEFT JOIN itens i ON ep.item_id = i.id
                WHERE ep.quantidade > 0
            ";

            $params = [];

            // Aplica filtros de data de validade
            switch ($filtro) {
                case '7dias':
                    $dataLimite = date('Y-m-d', strtotime('+7 days'));
                    $query .= " AND ep.data_validade BETWEEN ? AND ?";
                    $params[] = $hoje;
                    $params[] = $dataLimite;
                    break;

                case 'semana':
                    $dataLimite = date('Y-m-d', strtotime('+1 week'));
                    $query .= " AND ep.data_validade BETWEEN ? AND ?";
                    $params[] = $hoje;
                    $params[] = $dataLimite;
                    break;

                case 'mes':
                    $dataLimite = date('Y-m-d', strtotime('+1 month'));
                    $query .= " AND ep.data_validade BETWEEN ? AND ?";
                    $params[] = $hoje;
                    $params[] = $dataLimite;
                    break;

                case 'mes_proximo':
                    $inicioMesProximo = date('Y-m-d', strtotime('first day of next month'));
                    $fimMesProximo = date('Y-m-d', strtotime('last day of next month'));
                    $query .= " AND ep.data_validade BETWEEN ? AND ?";
                    $params[] = $inicioMesProximo;
                    $params[] = $fimMesProximo;
                    break;

                case 'periodo':
                    if ($dataInicio && $dataFim) {
                        $query .= " AND ep.data_validade BETWEEN ? AND ?";
                        $params[] = $dataInicio;
                        $params[] = $dataFim;
                    }
                    break;

                case 'todos':
                    // Sem filtro adicional
                    break;
            }

            $query .= " ORDER BY ep.data_validade ASC, ep.nome_produto ASC";

            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $produtos = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Adiciona informação de dias para vencer
            foreach ($produtos as &$produto) {
                $dataValidade = new DateTime($produto['data_validade']);
                $dataHoje = new DateTime($hoje);
                $diff = $dataHoje->diff($dataValidade);
                $produto['dias_para_vencer'] = (int)$diff->format('%r%a');
                
                // Define status baseado nos dias
                if ($produto['dias_para_vencer'] < 0) {
                    $produto['status'] = 'vencido';
                } elseif ($produto['dias_para_vencer'] <= 3) {
                    $produto['status'] = 'critico';
                } elseif ($produto['dias_para_vencer'] <= 7) {
                    $produto['status'] = 'atencao';
                } else {
                    $produto['status'] = 'ok';
                }
            }

            Response::json($produtos);

        } catch (PDOException $e) {
            Response::error('Erro ao buscar estoque: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Adiciona um produto ao estoque
     * POST /api/estoque
     * Body: { "item_id": 123, "nome_produto": "string", "data_compra": "YYYY-MM-DD", "data_validade": "YYYY-MM-DD", "quantidade": 10 }
     */
    public function criar() {
        Auth::authenticate();

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['nome_produto']) || !isset($data['data_validade']) || !isset($data['quantidade'])) {
            Response::error('Dados incompletos. Nome do produto, data de validade e quantidade são obrigatórios.', 400);
        }

        try {
            $stmt = $this->db->prepare("
                INSERT INTO estoque_pereciveis 
                (item_id, nome_produto, data_compra, data_validade, quantidade)
                VALUES (?, ?, ?, ?, ?)
            ");

            $itemId = $data['item_id'] ?? null;
            $nomeProduto = $data['nome_produto'];
            $dataCompra = $data['data_compra'] ?? date('Y-m-d');
            $dataValidade = $data['data_validade'];
            $quantidade = $data['quantidade'];

            $stmt->execute([
                $itemId,
                $nomeProduto,
                $dataCompra,
                $dataValidade,
                $quantidade
            ]);

            Response::success([
                'id' => $this->db->lastInsertId(),
                'message' => 'Produto adicionado ao estoque com sucesso'
            ]);

        } catch (PDOException $e) {
            Response::error('Erro ao adicionar produto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Abate quantidade de um produto
     * PUT /api/estoque/:id/abater
     * Body: { "quantidade": 1 }
     */
    public function abater($id) {
        Auth::authenticate();

        $data = json_decode(file_get_contents('php://input'), true);
        $quantidadeAbater = $data['quantidade'] ?? 1;

        try {
            // Busca o produto atual
            $stmt = $this->db->prepare("SELECT * FROM estoque_pereciveis WHERE id = ?");
            $stmt->execute([$id]);
            $produto = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$produto) {
                Response::error('Produto não encontrado', 404);
            }

            $novaQuantidade = $produto['quantidade'] - $quantidadeAbater;

            if ($novaQuantidade < 0) {
                Response::error('Quantidade a abater maior que o estoque disponível', 400);
            }

            if ($novaQuantidade == 0) {
                // Remove do estoque se zerar
                $stmt = $this->db->prepare("DELETE FROM estoque_pereciveis WHERE id = ?");
                $stmt->execute([$id]);
                
                Response::success([
                    'message' => 'Produto removido do estoque (quantidade zerada)',
                    'removed' => true
                ]);
            } else {
                // Atualiza a quantidade
                $stmt = $this->db->prepare("UPDATE estoque_pereciveis SET quantidade = ? WHERE id = ?");
                $stmt->execute([$novaQuantidade, $id]);

                Response::success([
                    'message' => 'Quantidade atualizada com sucesso',
                    'nova_quantidade' => $novaQuantidade,
                    'removed' => false
                ]);
            }

        } catch (PDOException $e) {
            Response::error('Erro ao abater quantidade: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Remove um produto do estoque
     * DELETE /api/estoque/:id
     */
    public function deletar($id) {
        Auth::authenticate();

        try {
            $stmt = $this->db->prepare("DELETE FROM estoque_pereciveis WHERE id = ?");
            $stmt->execute([$id]);

            if ($stmt->rowCount() === 0) {
                Response::error('Produto não encontrado', 404);
            }

            Response::success(['message' => 'Produto removido do estoque']);

        } catch (PDOException $e) {
            Response::error('Erro ao remover produto: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Busca detalhes de um produto específico
     * GET /api/estoque/:id
     */
    public function buscar($id) {
        Auth::authenticate();

        try {
            $stmt = $this->db->prepare("
                SELECT 
                    ep.*,
                    i.imagem,
                    i.nome as nome_catalogo
                FROM estoque_pereciveis ep
                LEFT JOIN itens i ON ep.item_id = i.id
                WHERE ep.id = ?
            ");
            $stmt->execute([$id]);
            $produto = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$produto) {
                Response::error('Produto não encontrado', 404);
            }

            Response::json($produto);

        } catch (PDOException $e) {
            Response::error('Erro ao buscar produto: ' . $e->getMessage(), 500);
        }
    }
}
