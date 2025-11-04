<?php

require_once __DIR__ . '/vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class Auth {
    private static $secret;

    public static function init() {
        self::$secret = $_ENV['JWT_SECRET'] ?? 'seu_secret_aqui';
    }

    public static function generateToken($user) {
        self::init();
        
        $payload = [
            'iss' => 'pedidos-estanciaa',
            'iat' => time(),
            'exp' => time() + (7 * 24 * 60 * 60), // 7 dias
            'data' => [
                'id' => $user['id'],
                'email' => $user['email'],
                'nome' => $user['nome']
            ]
        ];

        return JWT::encode($payload, self::$secret, 'HS256');
    }

    public static function verifyToken($token) {
        self::init();
        
        try {
            $decoded = JWT::decode($token, new Key(self::$secret, 'HS256'));
            return $decoded->data;
        } catch (Exception $e) {
            return null;
        }
    }

    public static function authenticate() {
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? null;

        if (!$authHeader) {
            Response::error('Token não fornecido', 401);
        }

        $token = str_replace('Bearer ', '', $authHeader);
        $user = self::verifyToken($token);

        if (!$user) {
            Response::error('Token inválido', 403);
        }

        return $user;
    }

    public static function hashPassword($password) {
        return password_hash($password, PASSWORD_BCRYPT);
    }

    public static function verifyPassword($password, $hash) {
        return password_verify($password, $hash);
    }
}
