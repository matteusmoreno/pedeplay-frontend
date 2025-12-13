/* * ========================================
 * ARQUIVO: src/hooks/useWebSocket.js
 * (Corrigido para retornar apenas a última mensagem)
 * ========================================
 */
import { useState, useEffect, useRef } from 'react';

const WS_URL = 'wss://pedeplay.onrender.com';
const RECONNECT_DELAY = 3000; // 3 segundos

export const useWebSocket = (artistId) => {
    const [lastMessage, setLastMessage] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);
    const reconnectTimeout = useRef(null);
    const shouldReconnect = useRef(true);

    useEffect(() => {
        if (!artistId) {
            setLastMessage(null);
            shouldReconnect.current = false;
            return;
        }

        shouldReconnect.current = true;

        const connect = () => {
            if (!shouldReconnect.current) return;

            const wsUrl = `${WS_URL}${artistId}`;
            console.log('🔌 Conectando WebSocket:', wsUrl);
            
            try {
                ws.current = new WebSocket(wsUrl);

                ws.current.onopen = () => {
                    console.log('✅ WebSocket CONECTADO:', wsUrl);
                    setIsConnected(true);
                };

                ws.current.onmessage = (event) => {
                    console.log('📩 WebSocket RAW:', event.data);
                    try {
                        const message = JSON.parse(event.data);
                        console.log('📦 WebSocket PARSED:', message);
                        setLastMessage(message);
                    } catch (err) {
                        console.error('❌ Erro ao parsear mensagem WebSocket:', err, event.data);
                    }
                };

                ws.current.onclose = (event) => {
                    console.log('🔌 WebSocket DESCONECTADO:', event.code, event.reason);
                    setIsConnected(false);
                    
                    // Reconecta automaticamente após delay
                    if (shouldReconnect.current) {
                        console.log(`🔄 Reconectando em ${RECONNECT_DELAY}ms...`);
                        reconnectTimeout.current = setTimeout(connect, RECONNECT_DELAY);
                    }
                };

                ws.current.onerror = (error) => {
                    console.error('❌ Erro no WebSocket:', error);
                    setIsConnected(false);
                };
            } catch (err) {
                console.error('❌ Erro ao criar WebSocket:', err);
                if (shouldReconnect.current) {
                    reconnectTimeout.current = setTimeout(connect, RECONNECT_DELAY);
                }
            }
        };

        connect();

        // Função de limpeza
        return () => {
            shouldReconnect.current = false;
            if (reconnectTimeout.current) {
                clearTimeout(reconnectTimeout.current);
            }
            if (ws.current) {
                ws.current.close();
            }
        };
    }, [artistId]);

    // 3. Retorna o objeto da última mensagem
    return { lastMessage, isConnected };
};