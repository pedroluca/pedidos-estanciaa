<?php

require_once __DIR__ . '/../config/Database.php';
require_once __DIR__ . '/../helpers/Response.php';
require_once __DIR__ . '/../helpers/Auth.php';

class AuthController {
    private $db;

    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }

    public function login() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['email']) || !isset($data['senha'])) {
            Response::error('Email e senha são obrigatórios', 400);
        }

        $email = $data['email'];
        $senha = $data['senha'];

        try {
            $stmt = $this->db->prepare('SELECT * FROM usuarios WHERE email = ? AND ativo = 1');
            $stmt->execute([$email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$user || !Auth::verifyPassword($senha, $user['senha'])) {
                Response::error('Credenciais inválidas', 401);
            }

            // Atualiza último acesso
            $updateStmt = $this->db->prepare('UPDATE usuarios SET ultimo_acesso = NOW() WHERE id = ?');
            $updateStmt->execute([$user['id']]);

            $token = Auth::generateToken($user);

            Response::json([
                'token' => $token,
                'user' => [
                    'id' => $user['id'],
                    'nome' => $user['nome'],
                    'email' => $user['email']
                ]
            ]);
        } catch (Exception $e) {
            Response::error('Erro interno do servidor: ' . $e->getMessage(), 500);
        }
    }

    public function register() {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['nome']) || !isset($data['email']) || !isset($data['senha'])) {
            Response::error('Nome, email e senha são obrigatórios', 400);
        }

        $nome = $data['nome'];
        $email = $data['email'];
        $senha = $data['senha'];

        if (strlen($senha) < 6) {
            Response::error('Senha deve ter no mínimo 6 caracteres', 400);
        }

        try {
            // Verifica se email já existe
            $stmt = $this->db->prepare('SELECT id FROM usuarios WHERE email = ?');
            $stmt->execute([$email]);
            
            if ($stmt->fetch()) {
                Response::error('Email já cadastrado', 400);
            }

            // Hash da senha
            $hashedPassword = Auth::hashPassword($senha);

            // Insere novo usuário
            $insertStmt = $this->db->prepare('INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)');
            $insertStmt->execute([$nome, $email, $hashedPassword]);

            $userId = $this->db->lastInsertId();
            
            $userStmt = $this->db->prepare('SELECT id, nome, email FROM usuarios WHERE id = ?');
            $userStmt->execute([$userId]);
            $user = $userStmt->fetch(PDO::FETCH_ASSOC);

            $token = Auth::generateToken($user);

            Response::json([
                'token' => $token,
                'user' => $user
            ], 201);
        } catch (Exception $e) {
            Response::error('Erro interno do servidor: ' . $e->getMessage(), 500);
        }
    }

    public function me() {
        $user = Auth::authenticate();
        
        try {
            $stmt = $this->db->prepare('SELECT id, nome, email FROM usuarios WHERE id = ? AND ativo = 1');
            $stmt->execute([$user->id]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);

            if (!$userData) {
                Response::error('Usuário não encontrado', 404);
            }

            Response::json(['user' => $userData]);
        } catch (Exception $e) {
            Response::error('Erro interno do servidor: ' . $e->getMessage(), 500);
        }
    }
}
