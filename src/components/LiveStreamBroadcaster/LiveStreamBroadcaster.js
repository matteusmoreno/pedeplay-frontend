import React, { useEffect, useRef, useState } from 'react';
import { useLiveStreamWebSocket } from '../../hooks/useLiveStreamWebSocket';
import { startLiveStream, stopLiveStream } from '../../services/liveStreamService';
import { useNotification } from '../../context/NotificationContext';
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import './LiveStreamBroadcaster.css';

const LiveStreamBroadcaster = ({ showId, artistId, onClose }) => {
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamQuality, setStreamQuality] = useState('HD');
    const [error, setError] = useState(null);
    const [mediaType, setMediaType] = useState('camera');
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [viewerCount, setViewerCount] = useState(0);
    const [isInitializing, setIsInitializing] = useState(false);
    
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const isConnectedRef = useRef(false);
    const peerConnectionsRef = useRef(new Map()); // Map de viewerId -> RTCPeerConnection
    const { addToast } = useNotification();

    useEffect(() => {
        console.log('🎬 LiveStreamBroadcaster montado com:', { showId, artistId });
    }, [showId, artistId]);
    
    const { isConnected, connect, sendMessage, onMessage, disconnect, error: wsError } = useLiveStreamWebSocket(
        showId,
        artistId,
        'broadcaster'
    );

    // Configuração do ICE servers
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    useEffect(() => {
        isConnectedRef.current = isConnected;
    }, [isConnected]);

    // Processa mensagens WebRTC signaling dos viewers
    useEffect(() => {
        onMessage(async (data) => {
            console.log('📥 Broadcaster recebeu:', data);
            
            if (typeof data === 'object') {
                switch (data.type) {
                    case 'viewer-count':
                    case 'viewer-count-updated':
                        console.log('👥 Atualização de viewers:', data.count);
                        setViewerCount(data.count || 0);
                        break;

                    case 'viewer-joined':
                        console.log('👤 Novo viewer:', data.viewerId);
                        // Cria nova peer connection e envia oferta
                        await createOfferForViewer(data.viewerId);
                        break;

                    case 'answer':
                        // Recebeu resposta de um viewer
                        console.log('� Recebeu answer do viewer:', data.viewerId);
                        await handleAnswer(data.viewerId, data.answer);
                        break;

                    case 'ice-candidate':
                        // Recebeu ICE candidate de um viewer
                        console.log('🧊 Recebeu ICE candidate do viewer:', data.viewerId);
                        await handleIceCandidate(data.viewerId, data.candidate);
                        break;

                    case 'viewer-left':
                        console.log('👋 Viewer saiu:', data.viewerId);
                        closePeerConnection(data.viewerId);
                        break;

                    default:
                        console.log('📨 Mensagem:', data);
                        break;
                }
            }
        });
    }, [onMessage]);

    /**
     * Cria oferta WebRTC para um viewer específico
     */
    const createOfferForViewer = async (viewerId) => {
        try {
            if (!streamRef.current) {
                console.warn('⚠️ Stream não disponível');
                return;
            }

            console.log('🔗 Criando PeerConnection para viewer:', viewerId);
            console.log('📹 Stream disponível:', streamRef.current.id);
            console.log('📹 Tracks do stream:', streamRef.current.getTracks().map(t => `${t.kind}: ${t.enabled ? 'ativo' : 'desativado'}`));
            
            const pc = new RTCPeerConnection(iceServers);
            peerConnectionsRef.current.set(viewerId, pc);

            // Adiciona todas as tracks do stream local
            streamRef.current.getTracks().forEach(track => {
                console.log('➕ Adicionando track:', track.kind, 'enabled:', track.enabled, 'readyState:', track.readyState);
                pc.addTrack(track, streamRef.current);
            });

            // Quando ICE candidate for gerado
            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('🧊 Enviando ICE candidate para viewer:', viewerId);
                    sendMessage({
                        type: 'ice-candidate',
                        viewerId: viewerId,
                        candidate: event.candidate
                    });
                }
            };

            // Monitora estado da conexão
            pc.onconnectionstatechange = () => {
                console.log(`� Connection state (${viewerId}):`, pc.connectionState);
                if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                    closePeerConnection(viewerId);
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log(`🧊 ICE connection state (${viewerId}):`, pc.iceConnectionState);
            };

            // Cria oferta com configurações de alta qualidade
            console.log('💬 Criando offer para viewer com alta qualidade:', viewerId);
            const offer = await pc.createOffer({
                offerToReceiveAudio: false,
                offerToReceiveVideo: false
            });

            // Otimiza SDP para melhor qualidade de áudio
            const optimizedSdp = optimizeAudioSDP(offer.sdp);
            offer.sdp = optimizedSdp;

            await pc.setLocalDescription(offer);

            console.log('📤 Enviando offer otimizado para viewer:', viewerId);
            sendMessage({
                type: 'offer',
                viewerId: viewerId,
                offer: offer
            });

        } catch (error) {
            console.error('❌ Erro ao criar oferta para viewer:', viewerId, error);
        }
    };

    /**
     * Processa resposta (answer) de um viewer
     */
    const handleAnswer = async (viewerId, answer) => {
        try {
            const pc = peerConnectionsRef.current.get(viewerId);
            if (!pc) {
                console.warn('⚠️ PeerConnection não encontrada para viewer:', viewerId);
                return;
            }

            console.log('📝 Setando remote description (answer) para viewer:', viewerId);
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('✅ Answer processado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao processar answer do viewer:', viewerId, error);
        }
    };

    /**
     * Processa ICE candidate de um viewer
     */
    const handleIceCandidate = async (viewerId, candidate) => {
        try {
            const pc = peerConnectionsRef.current.get(viewerId);
            if (!pc) {
                console.warn('⚠️ PeerConnection não encontrada para viewer:', viewerId);
                return;
            }

            console.log('🧊 Adicionando ICE candidate para viewer:', viewerId);
            await pc.addIceCandidate(new RTCIceCandidate(candidate));

        } catch (error) {
            console.error('❌ Erro ao adicionar ICE candidate do viewer:', viewerId, error);
        }
    };

    /**
     * Otimiza SDP para melhor qualidade de áudio
     */
    const optimizeAudioSDP = (sdp) => {
        let lines = sdp.split('\r\n');
        let audioIndex = -1;
        let optimizedLines = [];

        // Encontra a linha de mídia de áudio
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('m=audio')) {
                audioIndex = i;
                break;
            }
        }

        if (audioIndex === -1) return sdp;

        // Prioriza Opus com configurações de alta qualidade
        for (let i = 0; i < lines.length; i++) {
            optimizedLines.push(lines[i]);

            // Após encontrar codec Opus, adiciona parâmetros de alta qualidade
            if (lines[i].includes('a=rtpmap:') && lines[i].includes('opus')) {
                const codecId = lines[i].match(/a=rtpmap:(\d+)/)[1];
                
                // Remove parâmetros antigos se existirem
                if (i + 1 < lines.length && lines[i + 1].includes(`a=fmtp:${codecId}`)) {
                    i++; // Pula linha antiga
                }

                // Parâmetros otimizados para transmissão de máxima qualidade:
                // maxaveragebitrate: 510000 (510kbps - máxima qualidade permitida pelo Opus)
                // stereo: áudio estéreo
                // sprop-stereo: sinaliza suporte a estéreo
                // maxplaybackrate: 48000 (48kHz - qualidade CD)
                // minptime: 10ms (menor latência possível)
                // maxptime: 60ms (buffer otimizado)
                // useinbandfec: 1 (correção de erros inline)
                // usedtx: 0 (desabilitado para evitar cortes)
                optimizedLines.push(
                    `a=fmtp:${codecId} maxaveragebitrate=510000;stereo=1;sprop-stereo=1;maxplaybackrate=48000;minptime=10;maxptime=60;useinbandfec=1;usedtx=0`
                );
                console.log('🎵 Broadcast otimizado: Opus 510kbps estéreo 48kHz (máxima qualidade)');
            }
        }

        return optimizedLines.join('\r\n');
    };

    /**
     * Fecha peer connection específica
     */
    const closePeerConnection = (viewerId) => {
        const pc = peerConnectionsRef.current.get(viewerId);
        if (pc) {
            console.log('🔌 Fechando PeerConnection para viewer:', viewerId);
            pc.close();
            peerConnectionsRef.current.delete(viewerId);
        }
    };

    /**
     * Fecha todas as peer connections
     */
    const closeAllPeerConnections = () => {
        console.log('� Fechando todas as PeerConnections');
        peerConnectionsRef.current.forEach((pc, viewerId) => {
            pc.close();
        });
        peerConnectionsRef.current.clear();
    };

    // Monitora erros do WebSocket
    useEffect(() => {
        if (wsError) {
            setError(wsError);
            addToast('Erro na Transmissão', wsError, 'error');
        }
    }, [wsError, addToast]);

    /**
     * Captura stream da câmera com alta qualidade de áudio
     */
    const startCameraStream = async () => {
        try {
            const constraints = {
                video: {
                    width: streamQuality === 'FHD' ? 1920 : streamQuality === 'HD' ? 1280 : 640,
                    height: streamQuality === 'FHD' ? 1080 : streamQuality === 'HD' ? 720 : 480,
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: { ideal: 48000 }, // 48kHz para alta qualidade
                    sampleSize: { ideal: 16 }, // 16-bit
                    channelCount: { ideal: 2 }, // Estéreo
                    latency: 0.01, // Baixa latência
                    volume: 1.0
                }
            };

            console.log('🎤 Capturando áudio de alta qualidade: 48kHz estéreo 16-bit');
            streamRef.current = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Verifica configurações reais do áudio capturado
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                const settings = audioTrack.getSettings();
                console.log('🎵 Áudio capturado:', {
                    sampleRate: settings.sampleRate,
                    channelCount: settings.channelCount,
                    echoCancellation: settings.echoCancellation,
                    noiseSuppression: settings.noiseSuppression,
                    autoGainControl: settings.autoGainControl
                });
            }
            
            if (videoRef.current) {
                videoRef.current.srcObject = streamRef.current;
            }

            return streamRef.current;
        } catch (err) {
            console.error('Erro ao acessar câmera:', err);
            throw new Error('Não foi possível acessar a câmera. Verifique as permissões.');
        }
    };

    /**
     * Captura stream da tela com alta qualidade de áudio
     */
    const startScreenStream = async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    width: streamQuality === 'FHD' ? 1920 : streamQuality === 'HD' ? 1280 : 640,
                    height: streamQuality === 'FHD' ? 1080 : streamQuality === 'HD' ? 720 : 480,
                    frameRate: { ideal: 30 }
                },
                audio: {
                    echoCancellation: false, // Desligado para áudio do sistema
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: { ideal: 48000 },
                    sampleSize: { ideal: 16 },
                    channelCount: { ideal: 2 }
                }
            });

            // Adiciona áudio do microfone com alta qualidade
            try {
                const audioStream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        sampleRate: { ideal: 48000 },
                        sampleSize: { ideal: 16 },
                        channelCount: { ideal: 2 },
                        latency: 0.01,
                        volume: 1.0
                    }
                });
                const audioTrack = audioStream.getAudioTracks()[0];
                displayStream.addTrack(audioTrack);
                console.log('🎤 Áudio do microfone adicionado à transmissão de tela');
            } catch (err) {
                console.warn('Áudio do microfone não disponível:', err);
            }

            streamRef.current = displayStream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = displayStream;
            }

            // Detecta quando o usuário para o compartilhamento
            displayStream.getVideoTracks()[0].onended = () => {
                handleStopStream();
            };

            return displayStream;
        } catch (err) {
            console.error('Erro ao capturar tela:', err);
            throw new Error('Não foi possível capturar a tela.');
        }
    };

    /**
     * Inicia a transmissão
     */
    const handleStartStream = async () => {
        console.log('🎬 handleStartStream chamado');
        console.log('📋 Parâmetros:', { showId, artistId, mediaType, streamQuality });

        if (!showId) {
            addToast('Erro', 'Show ID não encontrado', 'error');
            return;
        }

        if (!artistId) {
            addToast('Erro', 'Artista ID não encontrado', 'error');
            return;
        }

        setError(null);
        setIsInitializing(true);

        try {
            // 1. Captura o stream de mídia PRIMEIRO
            console.log('📹 Capturando mídia do tipo:', mediaType);
            if (mediaType === 'camera') {
                await startCameraStream();
            } else {
                await startScreenStream();
            }
            console.log('✅ Mídia capturada com sucesso');

            // 2. Inicia a live stream no backend
            console.log('🎬 Iniciando live stream no backend...');
            await startLiveStream(showId, streamQuality);
            console.log('✅ Live stream iniciada no backend');

            // 3. Conecta ao WebSocket APÓS iniciar no backend
            console.log('🔌 Conectando ao WebSocket...');
            connect();

            // 4. Aguarda a conexão (com timeout)
            const maxWaitTime = 10000; // 10 segundos
            const startTime = Date.now();
            
            while ((Date.now() - startTime) < maxWaitTime) {
                await new Promise(resolve => setTimeout(resolve, 200));
                console.log('⏳ Aguardando conexão... isConnected:', isConnectedRef.current);
                if (isConnectedRef.current) {
                    break;
                }
            }

            if (!isConnectedRef.current) {
                console.error('❌ Timeout: WebSocket não conectou em 10 segundos');
                // Para o stream se WebSocket não conectou
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }
                throw new Error('Timeout: WebSocket não conectou. Verifique sua conexão.');
            }

            console.log('✅ WebSocket conectado com sucesso');

            // 5. Envia sinal de início
            const startMessage = {
                type: 'stream-started',
                showId,
                quality: streamQuality
            };
            console.log('📤 Enviando mensagem de início:', startMessage);
            sendMessage(startMessage);

            setIsStreaming(true);
            console.log('🎉 Transmissão iniciada com sucesso!');
            addToast('Vídeo Ao Vivo Iniciado', 'Sua transmissão de vídeo está ativa!', 'success');

        } catch (err) {
            setError(err.message);
            console.error('Erro ao iniciar transmissão:', err);
            addToast('Erro ao Iniciar', err.message, 'error');
            
            // Limpa recursos em caso de erro
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        } finally {
            setIsInitializing(false);
        }
    };

    /**
     * Para a transmissão
     */
    const handleStopStream = async () => {
        console.log('🛑 Encerrando transmissão...');
        
        try {
            // 1. Fecha todas as peer connections
            closeAllPeerConnections();

            // 2. Envia sinal de término
            if (isConnectedRef.current) {
                console.log('📤 Enviando sinal de término...');
                sendMessage({
                    type: 'stream-ended',
                    showId
                });
            }

            // 3. Para o stream de mídia
            if (streamRef.current) {
                console.log('📹 Parando captura de mídia...');
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }

            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }

            // 4. Desconecta WebSocket
            console.log('🔌 Desconectando WebSocket...');
            disconnect();

            // 5. Atualiza estado
            setIsStreaming(false);

            // 6. Tenta encerrar no backend (mas não falha se der erro)
            try {
                console.log('🎬 Encerrando no backend...');
                await stopLiveStream(showId);
                console.log('✅ Encerrado no backend');
            } catch (backendErr) {
                console.warn('⚠️ Erro ao encerrar no backend (ignorado):', backendErr.message);
            }

            addToast('Vídeo Ao Vivo Encerrado', 'Transmissão de vídeo finalizada', 'info');

        } catch (err) {
            console.error('❌ Erro ao parar transmissão:', err);
            setError('Erro ao encerrar transmissão');
            addToast('Erro ao Encerrar', err.message, 'error');
        }
    };

    /**
     * Alterna áudio
     */
    const toggleAudio = () => {
        if (streamRef.current) {
            const audioTrack = streamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    /**
     * Alterna vídeo
     */
    const toggleVideo = () => {
        if (streamRef.current) {
            const videoTrack = streamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    /**
     * Cleanup ao desmontar
     */
    useEffect(() => {
        return () => {
            console.log('🧹 Cleanup - fechando recursos');
            closeAllPeerConnections();
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    return (
        <div className={`livestream-broadcaster ${isStreaming ? 'streaming' : ''}`}>
            <div className="broadcaster-content">
                {/* Preview do vídeo */}
                <div className="video-preview">
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className={isVideoOff ? 'video-off' : ''}
                    />
                    {!isStreaming && !isInitializing && (
                        <div className="preview-overlay">
                            <p>Sua transmissão aparecerá aqui</p>
                        </div>
                    )}
                    {isInitializing && (
                        <div className="preview-overlay">
                            <p>⏳ Preparando transmissão...</p>
                        </div>
                    )}
                    {isStreaming && (
                        <div className="stream-badge">
                            <span className="live-indicator">● AO VIVO</span>
                            <span className="viewer-count">👥 {viewerCount}</span>
                        </div>
                    )}
                </div>

                {/* Configurações */}
                {!isStreaming && (
                    <div className="stream-settings">
                        <div className="setting-group">
                            <label>Tipo de Mídia:</label>
                            <select
                                value={mediaType}
                                onChange={(e) => setMediaType(e.target.value)}
                            >
                                <option value="camera">Câmera</option>
                                <option value="screen">Tela</option>
                            </select>
                        </div>

                        <div className="setting-group">
                            <label>Qualidade:</label>
                            <select
                                value={streamQuality}
                                onChange={(e) => setStreamQuality(e.target.value)}
                            >
                                <option value="SD">SD (480p)</option>
                                <option value="HD">HD (720p)</option>
                                <option value="FHD">Full HD (1080p)</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* Controles */}
                <div className="stream-controls">
                    {!isStreaming ? (
                        <button
                            className="btn-start-stream"
                            onClick={handleStartStream}
                            disabled={isInitializing}
                        >
                            {isInitializing ? (
                                <>⏳ Iniciando...</>
                            ) : (
                                <><FaVideo /> Iniciar Transmissão</>
                            )}
                        </button>
                    ) : (
                        <>
                            <button
                                className="btn-control"
                                onClick={toggleAudio}
                                title={isMuted ? 'Ativar microfone' : 'Silenciar microfone'}
                            >
                                {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
                            </button>

                            <button
                                className="btn-control"
                                onClick={toggleVideo}
                                title={isVideoOff ? 'Ativar câmera' : 'Desativar câmera'}
                            >
                                {isVideoOff ? <FaVideoSlash /> : <FaVideo />}
                            </button>

                            <button
                                className="btn-stop-stream"
                                onClick={handleStopStream}
                            >
                                Encerrar Transmissão
                            </button>
                        </>
                    )}
                </div>

                {/* Status e erros */}
                <div className="stream-status">
                    {error && <p className="error">⚠️ {error}</p>}
                    {wsError && <p className="error">⚠️ WebSocket: {wsError}</p>}
                    {!isStreaming && !isInitializing && !error && (
                        <p className="info">
                            💡 Escolha como deseja transmitir e clique em "Iniciar Transmissão"
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LiveStreamBroadcaster;
