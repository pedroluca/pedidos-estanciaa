<?php

class AudioCardController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll() {
        try {
            $stmt = $this->db->query("SELECT * FROM audio_cards ORDER BY created_at DESC");
            $cards = $stmt->fetchAll(PDO::FETCH_ASSOC);
            Response::json($cards);
        } catch (Exception $e) {
            Response::error('Erro ao buscar cartões de áudio: ' . $e->getMessage());
        }
    }

    public function getById($id) {
        try {
            $stmt = $this->db->prepare("SELECT * FROM audio_cards WHERE id = ?");
            $stmt->execute([$id]);
            $card = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$card) {
                Response::error('Cartão não encontrado', 404);
                return;
            }

            Response::json($card);
        } catch (Exception $e) {
            Response::error('Erro ao buscar cartão: ' . $e->getMessage());
        }
    }

    public function create() {
        try {
            // Validate input
            if (!isset($_POST['sender_name']) || !isset($_POST['receiver_name'])) {
                Response::error('Campos obrigatórios faltando');
                return;
            }

            // Handle File Upload
            if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
                Response::error('Arquivo de áudio é obrigatório');
                return;
            }

            $uploadDir = __DIR__ . '/../uploads/audio/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileExtension = pathinfo($_FILES['audio']['name'], PATHINFO_EXTENSION);
            $fileName = uniqid('audio_') . '.' . $fileExtension;
            $targetPath = $uploadDir . $fileName;

            // Allow only audio files
            $allowedTypes = ['mp3', 'wav', 'ogg', 'm4a'];
            if (!in_array(strtolower($fileExtension), $allowedTypes)) {
                Response::error('Tipo de arquivo não permitido. Use MP3, WAV, OGG ou M4A.');
                return;
            }

            if (!move_uploaded_file($_FILES['audio']['tmp_name'], $targetPath)) {
                Response::error('Falha ao salvar arquivo de áudio');
                return;
            }

            // Save to DB
            $sql = "INSERT INTO audio_cards (sender_name, receiver_name, sender_phone, receiver_phone, audio_path, order_code, status) 
                    VALUES (?, ?, ?, ?, ?, ?, 'active')";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $_POST['sender_name'],
                $_POST['receiver_name'],
                $_POST['sender_phone'] ?? null,
                $_POST['receiver_phone'] ?? null,
                'uploads/audio/' . $fileName, // Relative path for frontend
                $_POST['order_code'] ?? null
            ]);

            $id = $this->db->lastInsertId();
            
            Response::json([
                'id' => $id,
                'message' => 'Cartão de áudio criado com sucesso',
                'audio_url' => 'uploads/audio/' . $fileName
            ], 201);

        } catch (Exception $e) {
            Response::error('Erro ao criar cartão: ' . $e->getMessage());
        }
    }

    public function delete($id) {
        try {
            // Get file path first to delete file
            $stmt = $this->db->prepare("SELECT audio_path FROM audio_cards WHERE id = ?");
            $stmt->execute([$id]);
            $card = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($card) {
                $filePath = __DIR__ . '/../' . $card['audio_path'];
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }

            $stmt = $this->db->prepare("DELETE FROM audio_cards WHERE id = ?");
            $stmt->execute([$id]);

            Response::json(['message' => 'Cartão excluído com sucesso']);
        } catch (Exception $e) {
            Response::error('Erro ao excluir cartão: ' . $e->getMessage());
        }
    }
}
