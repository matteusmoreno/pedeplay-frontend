/* * ========================================
 * ARQUIVO: src/hooks/useWebSocket.js
 * (Corrigido para retornar apenas a última mensagem)
 * ========================================
 */
import { useState, useEffect, useRef } from 'react';

// ATENÇÃO: Seu backend está na porta 8182
const WS_URL = 'ws://localhost:8383/shows/live/';

export const useWebSocket = (artistId) => {
    // 1. Mudar de "messages" (array) para "lastMessage" (objeto)
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        if (!artistId) {
            // Limpa a última mensagem se não houver artista (show encerrado)
            setLastMessage(null);
            return;
        }

        // Conecta ao WebSocket
        ws.current = new WebSocket(`${WS_URL}${artistId}`);

        ws.current.onopen = () => {
            console.log('WebSocket conectado para o artista:', artistId);
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            console.log('Nova mensagem WebSocket:', event.data);
            const message = JSON.parse(event.data);

            // 2. Apenas armazena a mensagem mais recente
            setLastMessage(message);
        };

        ws.current.onclose = () => {
            console.log('WebSocket desconectado.');
            setIsConnected(false);
        };

        ws.current.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
            setIsConnected(false);
        };

        // Função de limpeza para fechar a conexão
        return () => {
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [artistId]);

    // 3. Retorna o objeto da última mensagem
    return { lastMessage, isConnected };
};