import { useEffect, useRef } from 'react';
import { api } from '../lib/api';

export function useOrderPolling(onUpdate?: () => void) {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    const pollOrders = async () => {
      try {
        const result = await api.pollOrders();
        console.log('Polling result:', result);
        
        // Se houver novos pedidos ou atualizações, chama callback
        if ((result.novos > 0 || result.atualizados > 0) && onUpdate) {
          onUpdate();
        }
      } catch (error) {
        console.error('Erro no polling:', error);
      }
    };

    // Executa imediatamente
    pollOrders();

    // Configura polling a cada 60 segundos (1 minuto)
    intervalRef.current = window.setInterval(pollOrders, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Dependency array vazio para evitar restart do polling
}
