-- Migration: Adiciona campo para controlar edição manual de status
-- Data: 2025-11-07
-- Descrição: Adiciona campo status_editado_manualmente para permitir que 
--            o polling atualize itens mas não o status quando editado manualmente

ALTER TABLE pedidos 
ADD COLUMN status_editado_manualmente TINYINT(1) DEFAULT 0 AFTER editado_manualmente,
ADD INDEX idx_status_editado_manualmente (status_editado_manualmente);

-- Comentário dos campos:
-- editado_manualmente: Flag geral que protege data e horário de edição
-- status_editado_manualmente: Flag específica que protege apenas o status de edição
