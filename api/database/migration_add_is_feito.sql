-- Migration: Adicionar coluna is_feito na tabela pedidos
-- Data: 2025-11-05
-- Descrição: Adiciona campo para marcar pedidos como feitos na produção

ALTER TABLE pedidos 
ADD COLUMN is_feito TINYINT(1) DEFAULT 0 AFTER valor_total,
ADD INDEX idx_is_feito (is_feito);

-- Atualizar todos os pedidos existentes com is_feito = 0
UPDATE pedidos SET is_feito = 0 WHERE is_feito IS NULL;
