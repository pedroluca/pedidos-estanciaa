-- Migration: Cria tabela de controle de estoque de produtos perecíveis
-- Data: 2025-11-10
-- Descrição: Controla produtos com data de validade para evitar perdas

CREATE TABLE IF NOT EXISTS estoque_pereciveis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NULL,
    nome_produto VARCHAR(255) NOT NULL,
    data_compra DATE NOT NULL,
    data_validade DATE NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key opcional para itens do catálogo
    FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE SET NULL,
    
    -- Índices para melhor performance nas buscas
    INDEX idx_data_validade (data_validade),
    INDEX idx_item_id (item_id),
    INDEX idx_quantidade (quantidade)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Comentários
-- item_id: NULL para produtos não cadastrados no catálogo
-- nome_produto: nome do produto (obrigatório)
-- data_compra: data de aquisição do produto
-- data_validade: data de vencimento
-- quantidade: quantidade em estoque deste lote
