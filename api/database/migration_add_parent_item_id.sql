-- Migration: Adiciona suporte para hierarquia de itens (sub-itens/adicionais)
-- Data: 2026-02-03
-- Descrição: Adiciona coluna parent_pedido_item_id na tabela pedidos_itens
--            para permitir que um item seja filho de outro item

ALTER TABLE pedidos_itens 
ADD COLUMN parent_pedido_item_id INT NULL DEFAULT NULL AFTER observacoes,
ADD INDEX idx_parent_item (parent_pedido_item_id);
