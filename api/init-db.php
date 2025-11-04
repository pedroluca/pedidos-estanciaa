<?php

require_once __DIR__ . '/config/Database.php';

echo "🚀 Inicializando banco de dados...\n";

try {
    $db = Database::getInstance();
    $db->initDatabase();
    echo "✅ Banco de dados inicializado com sucesso!\n";
    echo "✅ Usuário admin criado: admin@estanciaa.com / admin123\n";
} catch (Exception $e) {
    echo "❌ Erro ao inicializar banco de dados: " . $e->getMessage() . "\n";
    exit(1);
}
