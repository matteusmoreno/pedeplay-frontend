import { useEffect, useRef, useState, useCallback } from 'react';

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

                // 🔧 CORREÇÃO: Não reconecta em casos específicos
                // Código 1008 = CANNOT_ACCEPT (broadcaster já ativo)
                // Código 1013 = TRY_AGAIN_LATER (cooldown ativo)
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

                // Código 1000 = NORMAL_CLOSURE (fechamento normal pelo usuário)
                if (event.code === 1000) {
                    console.log('🔌 Desconexão normal. NÃO reconectando.');
                    shouldReconnectRef.current = false;
                    return;
                }

                // ✅ Apenas reconecta em caso de erro de rede (código 1006)
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
            // Fecha com código 1000 (fechamento normal)
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
                // Envia dados binários
                wsRef.current.send(message);
            } else if (typeof message === 'string') {
                wsRef.current.send(message);
            } else {
                // Converte objeto para JSON
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
        connect,      // Exporta connect para uso manual
        disconnect,
        sendMessage,  // Agora envia tanto texto quanto binário
        onMessage
    };
};
