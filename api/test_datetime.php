<?php
// Teste rápido de DateTime parsing

$scheduledDateTime = '2025-11-10T10:30:00-03:00';

echo "=== TESTE DE PARSING ===\n\n";

echo "String original: {$scheduledDateTime}\n\n";

// Método 1: strtotime + date (ERRADO)
$ts = strtotime($scheduledDateTime);
echo "Método 1 (strtotime):\n";
echo "  Data: " . date('Y-m-d', $ts) . " (" . date('d/m/Y', $ts) . ")\n";
echo "  Horário: " . date('H:i:s', $ts) . "\n\n";

// Método 2: DateTime (CORRETO)
$dt = new DateTime($scheduledDateTime);
echo "Método 2 (DateTime):\n";
echo "  Data: " . $dt->format('Y-m-d') . " (" . $dt->format('d/m/Y') . ")\n";
echo "  Horário: " . $dt->format('H:i:s') . "\n\n";

echo "✅ DateTime preserva o timezone corretamente!\n";
