-- Schema do banco de dados MySQL para o sistema de pedidos da Floricultura Estância-A

CREATE DATABASE IF NOT EXISTS pedidos_estanciaa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pedidos_estanciaa;

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  senha VARCHAR(255) NOT NULL,
  ativo TINYINT(1) DEFAULT 1,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acesso TIMESTAMP NULL DEFAULT NULL,
  INDEX idx_email (email),
  INDEX idx_ativo (ativo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categorias (
  id INT PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  imagem TEXT,
  ativo TINYINT(1) DEFAULT 1,
  indice INT DEFAULT 0,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_ativo (ativo),
  INDEX idx_indice (indice)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de itens (produtos do catálogo)
CREATE TABLE IF NOT EXISTS itens (
  id INT PRIMARY KEY,
  categoria_id INT,
  nome VARCHAR(255) NOT NULL,
  descricao TEXT,
  imagem TEXT,
  preco DECIMAL(10, 2) NOT NULL,
  preco_promocional DECIMAL(10, 2),
  preco_promocional_ativo TINYINT(1) DEFAULT 0,
  tipo_unidade VARCHAR(10) DEFAULT 'UN',
  status VARCHAR(20) DEFAULT 'ACTIVE',
  ativo TINYINT(1) DEFAULT 1,
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_categoria (categoria_id),
  INDEX idx_ativo (ativo),
  INDEX idx_status (status),
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_pedido VARCHAR(50) UNIQUE NOT NULL,
  nome_cliente VARCHAR(255) NOT NULL,
  telefone_cliente VARCHAR(20),
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_agendamento DATE NOT NULL,
  horario_agendamento TIME NOT NULL,
  status VARCHAR(50) DEFAULT 'Aguardando',
  tipo_entrega VARCHAR(20) DEFAULT 'DELIVERY',
  endereco_entrega TEXT,
  observacoes TEXT,
  valor_total DECIMAL(10, 2) DEFAULT 0,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_numero_pedido (numero_pedido),
  INDEX idx_data_agendamento (data_agendamento),
  INDEX idx_status (status),
  INDEX idx_data_criacao (data_criacao)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabela de relacionamento pedidos <-> itens
CREATE TABLE IF NOT EXISTS pedidos_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  item_id INT NOT NULL,
  quantidade INT NOT NULL DEFAULT 1,
  preco_unitario DECIMAL(10, 2) NOT NULL,
  preco_total DECIMAL(10, 2) NOT NULL,
  observacoes TEXT,
  INDEX idx_pedido (pedido_id),
  INDEX idx_item (item_id),
  FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES itens(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Usuário admin padrão (senha: admin123)
-- Hash bcrypt de 'admin123': $2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
INSERT INTO usuarios (id, nome, email, senha) 
VALUES (1, 'Administrador', 'admin@estanciaa.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE nome = nome;
