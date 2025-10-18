import { useState, useEffect, useRef } from 'react';

// ATENÇÃO: Seu backend está na porta 8182
const WS_URL = 'ws://localhost:8182/shows/live/';

export const useWebSocket = (artistId) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        if (!artistId) return;

        // Conecta ao WebSocket
        ws.current = new WebSocket(`${WS_URL}${artistId}`);

        ws.current.onopen = () => {
            console.log('WebSocket conectado para o artista:', artistId);
            setIsConnected(true);
        };

        ws.current.onmessage = (event) => {
            console.log('Nova mensagem WebSocket:', event.data);
            const message = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, message]);
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

    return { messages, isConnected };
};