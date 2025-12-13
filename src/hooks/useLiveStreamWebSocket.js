/* * ========================================
 * ARQUIVO: src/hooks/useLiveStreamWebSocket.js
 * (URL Hardcoded para Produção no Render)
 * ========================================
 */
import { useEffect, useRef, useState, useCallback } from 'react';

// ✅ CORREÇÃO: URL base apenas do domínio (sem barra no final)
const WS_BASE_URL = 'wss://pedeplay.onrender.com';

export const useLiveStreamWebSocket = (showId, userId, role) => {
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState(null);
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);
    const onMessageCallbackRef = useRef(null);
    const shouldReconnectRef = useRef(true);

    /**
     * Conecta ao WebSocket
     */
    const connect = useCallback(() => {
        if (!showId || !userId || !role) {
            console.warn('Missing parameters for WebSocket connection');
            return;
        }

        try {
            // Monta a URL: wss://pedeplay.onrender.com/livestream/SHOW_ID/USER_ID/ROLE
            const wsUrl = `${WS_BASE_URL}/livestream/${showId}/${userId}/${role}`;
            console.log('Connecting to WebSocket:', wsUrl);

            wsRef.current = new WebSocket(wsUrl);
            wsRef.current.binaryType = 'arraybuffer'; // Para receber dados binários

            wsRef.current.onopen = () => {
                console.log('✅ WebSocket connected');
                setIsConnected(true);
                setError(null);
                shouldReconnectRef.current = true; // Permite reconexão em caso de erro
            };

            wsRef.current.onmessage = (event) => {
                if (onMessageCallbackRef.current) {
                    // Se for string, tenta fazer parse JSON
                    if (typeof event.data === 'string') {
                        try {
                            const data = JSON.parse(event.data);
                            onMessageCallbackRef.current(data);
                        } catch (err) {
                            onMessageCallbackRef.current(event.data);
                        }
                    } else {
                        // Dados binários (ArrayBuffer)
                        onMessageCallbackRef.current(event.data);
                    }
                }
            };

            wsRef.current.onerror = (err) => {
                console.error('❌ WebSocket error:', err);
                setError('Erro na conexão WebSocket');
            };

            wsRef.current.onclose = (event) => {
                console.log('WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
                setIsConnected(false);

                // Não reconecta em casos específicos
                if (event.code === 1008) {
                    console.warn('🚫 Broadcaster já ativo. NÃO reconectando.');
                    shouldReconnectRef.current = false;
                    setError('Já existe uma transmissão ativa');
                    return;
                }

                if (event.code === 1013) {
                    console.warn('⏳ Cooldown ativo. NÃO reconectando agora.');
                    shouldReconnectRef.current = false;
                    setError('Aguarde alguns segundos antes de tentar novamente');
                    return;
                }

                if (event.code === 1000) {
                    console.log('🔌 Desconexão normal. NÃO reconectando.');
                    shouldReconnectRef.current = false;
                    return;
                }

                // Apenas reconecta em caso de erro de rede
                if (event.code === 1006 && shouldReconnectRef.current) {
                    console.log('🔄 Erro de rede. Tentando reconectar em 5 segundos...');
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 5000);
                }
            };
        } catch (err) {
            console.error('Error creating WebSocket:', err);
            setError('Erro ao criar conexão WebSocket');
        }
    }, [showId, userId, role]);

    /**
     * Desconecta do WebSocket
     */
    const disconnect = useCallback(() => {
        console.log('Desconectando WebSocket...');
        shouldReconnectRef.current = false; // Desabilita reconexão

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnected');
            wsRef.current = null;
        }

        setIsConnected(false);
    }, []);

    /**
     * Envia mensagem (texto ou binário)
     */
    const sendMessage = useCallback((message) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            if (message instanceof ArrayBuffer || message instanceof Blob) {
                wsRef.current.send(message);
            } else if (typeof message === 'string') {
                wsRef.current.send(message);
            } else {
                wsRef.current.send(JSON.stringify(message));
            }
        } else {
            console.warn('WebSocket not connected');
        }
    }, []);

    /**
     * Define callback para mensagens recebidas
     */
    const onMessage = useCallback((callback) => {
        onMessageCallbackRef.current = callback;
    }, []);

    // Não conecta automaticamente - espera chamada explícita
    useEffect(() => {
        return () => {
            disconnect();
        };
    }, [disconnect]);

    return {
        isConnected,
        error,
        connect,
        disconnect,
        sendMessage,
        onMessage
    };
};