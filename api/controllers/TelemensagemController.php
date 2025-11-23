<?php

class TelemensagemController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function getAll() {
        try {
            $stmt = $this->db->query("SELECT * FROM telemensagens ORDER BY title ASC");
            $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);
            Response::json($messages);
        } catch (Exception $e) {
            Response::error('Erro ao buscar telemensagens: ' . $e->getMessage());
        }
    }

    public function create() {
        try {
            if (!isset($_POST['title']) || !isset($_POST['category'])) {
                Response::error('Título e categoria são obrigatórios');
                return;
            }

            if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
                Response::error('Arquivo de áudio é obrigatório');
                return;
            }

            $uploadDir = __DIR__ . '/../uploads/telemensagens/';
            if (!file_exists($uploadDir)) {
                mkdir($uploadDir, 0777, true);
            }

            $fileExtension = pathinfo($_FILES['audio']['name'], PATHINFO_EXTENSION);
            $fileName = uniqid('tele_') . '.' . $fileExtension;
            $targetPath = $uploadDir . $fileName;

            $allowedTypes = ['mp3', 'wav', 'ogg', 'm4a'];
            if (!in_array(strtolower($fileExtension), $allowedTypes)) {
                Response::error('Tipo de arquivo não permitido. Use MP3, WAV, OGG ou M4A.');
                return;
            }

            if (!move_uploaded_file($_FILES['audio']['tmp_name'], $targetPath)) {
                Response::error('Falha ao salvar arquivo de áudio');
                return;
            }

            $stmt = $this->db->prepare("INSERT INTO telemensagens (title, category, audio_path) VALUES (?, ?, ?)");
            $stmt->execute([
                $_POST['title'],
                $_POST['category'],
                'uploads/telemensagens/' . $fileName
            ]);

            Response::json([
                'id' => $this->db->lastInsertId(),
                'message' => 'Telemensagem adicionada com sucesso',
                'audio_path' => 'uploads/telemensagens/' . $fileName
            ], 201);

        } catch (Exception $e) {
            Response::error('Erro ao criar telemensagem: ' . $e->getMessage());
        }
    }

    public function delete($id) {
        try {
            $stmt = $this->db->prepare("SELECT audio_path FROM telemensagens WHERE id = ?");
            $stmt->execute([$id]);
            $message = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($message) {
                $filePath = __DIR__ . '/../' . $message['audio_path'];
                if (file_exists($filePath)) {
                    unlink($filePath);
                }
            }

            $stmt = $this->db->prepare("DELETE FROM telemensagens WHERE id = ?");
            $stmt->execute([$id]);

            Response::json(['message' => 'Telemensagem excluída com sucesso']);
        } catch (Exception $e) {
            Response::error('Erro ao excluir telemensagem: ' . $e->getMessage());
        }
    }
}
