<?php

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class CatalogoController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function syncFromCardapio() {
        Auth::authenticate(); // Apenas usuários autenticados podem sincronizar
        
        $apiUrl = $_ENV['CARDAPIO_API_URL'] ?? 'https://api.cardapiodigital.io';
        $token = $_ENV['CARDAPIO_API_TOKEN'] ?? '';

        if (empty($token)) {
            Response::error('Token do Cardápio Web não configurado', 500);
        }

        try {
            $ch = curl_init($apiUrl . '/api/partner/v1/catalog');
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'X-API-KEY: ' . $token
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                Response::error('Erro ao buscar catálogo do Cardápio Web', 500);
            }

            $data = json_decode($response, true);
            
            if (!isset($data['categories'])) {
                Response::error('Formato de resposta inválido', 500);
            }

            $this->db->beginTransaction();

            $categoriesCount = 0;
            $itemsCount = 0;

            foreach ($data['categories'] as $category) {
                // Insere ou atualiza categoria
                $stmt = $this->db->prepare('
                    INSERT INTO categorias (id, nome, descricao, imagem, ativo, indice, data_atualizacao)
                    VALUES (?, ?, ?, ?, ?, ?, NOW())
                    ON DUPLICATE KEY UPDATE
                        nome = VALUES(nome),
                        descricao = VALUES(descricao),
                        imagem = VALUES(imagem),
                        ativo = VALUES(ativo),
                        indice = VALUES(indice),
                        data_atualizacao = NOW()
                ');
                
                $stmt->execute([
                    $category['id'],
                    $category['name'],
                    $category['description'] ?? '',
                    $category['image'] ?? null,
                    $category['status'] === 'ACTIVE' ? 1 : 0,
                    $category['index'] ?? 0
                ]);
                
                $categoriesCount++;

                // Insere ou atualiza itens
                foreach ($category['items'] as $item) {
                    $imageUrl = null;
                    if (isset($item['image']['image_url'])) {
                        $imageUrl = $item['image']['image_url'];
                    } elseif (isset($item['image']['thumbnail_url'])) {
                        $imageUrl = $item['image']['thumbnail_url'];
                    }

                    $stmt = $this->db->prepare('
                        INSERT INTO itens (id, categoria_id, nome, descricao, imagem, preco, 
                            preco_promocional, preco_promocional_ativo, tipo_unidade, status, ativo, data_atualizacao)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
                        ON DUPLICATE KEY UPDATE
                            categoria_id = VALUES(categoria_id),
                            nome = VALUES(nome),
                            descricao = VALUES(descricao),
                            imagem = VALUES(imagem),
                            preco = VALUES(preco),
                            preco_promocional = VALUES(preco_promocional),
                            preco_promocional_ativo = VALUES(preco_promocional_ativo),
                            tipo_unidade = VALUES(tipo_unidade),
                            status = VALUES(status),
                            ativo = VALUES(ativo),
                            data_atualizacao = NOW()
                    ');

                    $stmt->execute([
                        $item['id'],
                        $category['id'],
                        $item['name'],
                        $item['description'] ?? '',
                        $imageUrl,
                        $item['price'],
                        $item['promotional_price'] ?? null,
                        $item['promotional_price_active'] ? 1 : 0,
                        $item['unit_type'] ?? 'UN',
                        $item['status'],
                        $item['status'] === 'ACTIVE' ? 1 : 0
                    ]);

                    $itemsCount++;
                }
            }

            $this->db->commit();

            Response::success([
                'categories' => $categoriesCount,
                'items' => $itemsCount
            ], 'Catálogo sincronizado com sucesso');

        } catch (Exception $e) {
            $this->db->rollBack();
            Response::error('Erro ao sincronizar catálogo: ' . $e->getMessage(), 500);
        }
    }

    public function getCategorias() {
        try {
            $stmt = $this->db->query('SELECT * FROM categorias WHERE ativo = 1 ORDER BY indice, nome');
            $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
            Response::json($categorias);
        } catch (Exception $e) {
            Response::error('Erro ao buscar categorias: ' . $e->getMessage(), 500);
        }
    }

    public function getItens() {
        $categoriaId = $_GET['categoria_id'] ?? null;
        
        try {
            if ($categoriaId) {
                $stmt = $this->db->prepare('SELECT * FROM itens WHERE categoria_id = ? AND ativo = 1 ORDER BY nome');
                $stmt->execute([$categoriaId]);
            } else {
                $stmt = $this->db->query('SELECT * FROM itens WHERE ativo = 1 ORDER BY nome');
            }
            
            $itens = $stmt->fetchAll(PDO::FETCH_ASSOC);
            Response::json($itens);
        } catch (Exception $e) {
            Response::error('Erro ao buscar itens: ' . $e->getMessage(), 500);
        }
    }

    public function getItem($id) {
        try {
            $stmt = $this->db->prepare('SELECT * FROM itens WHERE id = ? AND ativo = 1');
            $stmt->execute([$id]);
            $item = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$item) {
                Response::error('Item não encontrado', 404);
            }

            Response::json($item);
        } catch (Exception $e) {
            Response::error('Erro ao buscar item: ' . $e->getMessage(), 500);
        }
    }
}
