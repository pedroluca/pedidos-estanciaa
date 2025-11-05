-- Migration: Adicionar coluna editado_manualmente na tabela pedidos
-- Data: 2025-11-05
-- Descrição: Adiciona campo para proteger pedidos editados manualmente do polling

ALTER TABLE pedidos 
ADD COLUMN editado_manualmente TINYINT(1) DEFAULT 0 AFTER is_feito,
ADD INDEX idx_editado_manualmente (editado_manualmente);

-- Atualizar todos os pedidos existentes com editado_manualmente = 0
UPDATE pedidos SET editado_manualmente = 0 WHERE editado_manualmente IS NULL;
