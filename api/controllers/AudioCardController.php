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

            // Handle Audio Source (Upload or Catalog)
            $audioPath = null;
            
            if (isset($_POST['telemensagem_id']) && !empty($_POST['telemensagem_id'])) {
                // Get audio from catalog
                $stmt = $this->db->prepare("SELECT audio_path FROM telemensagens WHERE id = ?");
                $stmt->execute([$_POST['telemensagem_id']]);
                $telemensagem = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($telemensagem) {
                    $audioPath = $telemensagem['audio_path']; // Use the same file path
                } else {
                    Response::error('Telemensagem não encontrada');
                    return;
                }
            } elseif (isset($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK) {
                // Handle File Upload
                $uploadDir = __DIR__ . '/../uploads/audio/';
                if (!file_exists($uploadDir)) {
                    mkdir($uploadDir, 0777, true);
                }

                $fileExtension = pathinfo($_FILES['audio']['name'], PATHINFO_EXTENSION);
                $fileName = uniqid('audio_') . '.' . $fileExtension;
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
                $audioPath = 'uploads/audio/' . $fileName;
            } else {
                Response::error('Arquivo de áudio ou seleção do catálogo é obrigatório');
                return;
            }

            // Handle Image Upload (Optional)
            $imagePath = null;
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $imageUploadDir = __DIR__ . '/../uploads/images/';
                if (!file_exists($imageUploadDir)) {
                    mkdir($imageUploadDir, 0777, true);
                }

                $imageExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
                $imageName = uniqid('img_') . '.' . $imageExtension;
                $imageTargetPath = $imageUploadDir . $imageName;

                $allowedImageTypes = ['jpg', 'jpeg', 'png', 'webp'];
                if (in_array(strtolower($imageExtension), $allowedImageTypes)) {
                    if (move_uploaded_file($_FILES['image']['tmp_name'], $imageTargetPath)) {
                        $imagePath = 'uploads/images/' . $imageName;
                    }
                }
            }

            // Save to DB
            $sql = "INSERT INTO audio_cards (sender_name, receiver_name, sender_phone, receiver_phone, audio_path, image_path, order_code, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, 'active')";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $_POST['sender_name'],
                $_POST['receiver_name'],
                $_POST['sender_phone'] ?? null,
                $_POST['receiver_phone'] ?? null,
                $audioPath,
                $imagePath,
                $_POST['order_code'] ?? null
            ]);

            $id = $this->db->lastInsertId();
            
            Response::json([
                'id' => $id,
                'message' => 'Cartão de áudio criado com sucesso',
                'audio_url' => $audioPath,
                'image_url' => $imagePath
            ], 201);

        } catch (Exception $e) {
            Response::error('Erro ao criar cartão: ' . $e->getMessage());
        }
    }

    public function update($id) {
        try {
            // Validate input
            if (!isset($_POST['sender_name']) || !isset($_POST['receiver_name'])) {
                Response::error('Campos obrigatórios faltando');
                return;
            }

            // Get current card
            $stmt = $this->db->prepare("SELECT * FROM audio_cards WHERE id = ?");
            $stmt->execute([$id]);
            $currentCard = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$currentCard) {
                Response::error('Cartão não encontrado', 404);
                return;
            }

            $audioPath = $currentCard['audio_path'];
            $imagePath = $currentCard['image_path'];

            // Handle Audio Update
            if (isset($_POST['telemensagem_id']) && !empty($_POST['telemensagem_id'])) {
                // Switch to catalog audio
                $stmt = $this->db->prepare("SELECT audio_path FROM telemensagens WHERE id = ?");
                $stmt->execute([$_POST['telemensagem_id']]);
                $telemensagem = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($telemensagem) {
                    // If old audio was uploaded (starts with uploads/audio/), delete it? 
                    // Maybe safer to keep for now or check if it's not used by others.
                    // For simplicity, we just update the path.
                    $audioPath = $telemensagem['audio_path'];
                }
            } elseif (isset($_FILES['audio']) && $_FILES['audio']['error'] === UPLOAD_ERR_OK) {
                // Upload new audio
                $uploadDir = __DIR__ . '/../uploads/audio/';
                $fileExtension = pathinfo($_FILES['audio']['name'], PATHINFO_EXTENSION);
                $fileName = uniqid('audio_') . '.' . $fileExtension;
                $targetPath = $uploadDir . $fileName;

                if (move_uploaded_file($_FILES['audio']['tmp_name'], $targetPath)) {
                    $audioPath = 'uploads/audio/' . $fileName;
                    // Ideally delete old file if it was an upload
                }
            }

            // Handle Image Update
            if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
                $imageUploadDir = __DIR__ . '/../uploads/images/';
                $imageExtension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
                $imageName = uniqid('img_') . '.' . $imageExtension;
                $imageTargetPath = $imageUploadDir . $imageName;

                if (move_uploaded_file($_FILES['image']['tmp_name'], $imageTargetPath)) {
                    $imagePath = 'uploads/images/' . $imageName;
                }
            }

            // Update DB
            $sql = "UPDATE audio_cards SET 
                    sender_name = ?, 
                    receiver_name = ?, 
                    sender_phone = ?, 
                    receiver_phone = ?, 
                    audio_path = ?, 
                    image_path = ?, 
                    order_code = ? 
                    WHERE id = ?";
            
            $stmt = $this->db->prepare($sql);
            $stmt->execute([
                $_POST['sender_name'],
                $_POST['receiver_name'],
                $_POST['sender_phone'] ?? null,
                $_POST['receiver_phone'] ?? null,
                $audioPath,
                $imagePath,
                $_POST['order_code'] ?? null,
                $id
            ]);

            Response::json([
                'id' => $id,
                'message' => 'Cartão atualizado com sucesso',
                'audio_url' => $audioPath,
                'image_url' => $imagePath
            ]);

        } catch (Exception $e) {
            Response::error('Erro ao atualizar cartão: ' . $e->getMessage());
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
                
                if (!empty($card['image_path'])) {
                    $imagePath = __DIR__ . '/../' . $card['image_path'];
                    if (file_exists($imagePath)) {
                        unlink($imagePath);
                    }
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
