CREATE TABLE IF NOT EXISTS audio_cards (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_name VARCHAR(255) NOT NULL,
    receiver_name VARCHAR(255) NOT NULL,
    sender_phone VARCHAR(20),
    receiver_phone VARCHAR(20),
    audio_path VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, archived
    order_code VARCHAR(100), -- Optional link to main system order
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
