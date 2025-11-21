import React, { useEffect, useRef, useState } from 'react';
import { useLiveStreamWebSocket } from '../../hooks/useLiveStreamWebSocket';
import { registerViewer } from '../../services/liveStreamService';
import { FaExpand, FaCompress, FaVolumeUp, FaVolumeMute, FaVolumeDown } from 'react-icons/fa';
import './LiveStreamViewer.css';

const LiveStreamViewer = ({ showId, userId, onStreamEnd }) => {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMuted, setIsMuted] = useState(false); // Tenta com áudio
    const [volume, setVolume] = useState(100);
    const [streamStatus, setStreamStatus] = useState('connecting');
    const [viewerCount, setViewerCount] = useState(0);
    
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const peerConnectionRef = useRef(null);
    const iceCandidatesQueueRef = useRef([]);

    const { isConnected, connect, sendMessage, onMessage, disconnect } = useLiveStreamWebSocket(
        showId,
        userId,
        'viewer'
    );

    // Configuração do ICE servers (STUN/TURN)
    const iceServers = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    };

    // Conecta ao WebSocket quando montar
    useEffect(() => {
        console.log('📺 Viewer: Conectando ao WebSocket...');
        connect();
    }, [connect]);

    // Inicializa WebRTC quando conectar
    useEffect(() => {
        if (isConnected) {
            console.log('✅ Viewer conectado - Registrando viewer');
            setStreamStatus('waiting');
            registerViewer(showId, userId);
        }
    }, [isConnected, showId, userId]);

    // Processa mensagens WebRTC signaling
    useEffect(() => {
        onMessage(async (data) => {
            if (typeof data === 'object' && data.type) {
                console.log('📥 Viewer recebeu mensagem:', data.type);
                
                switch (data.type) {
                    case 'stream-started':
                    case 'broadcaster-ready':
                        console.log('🎬 Broadcaster está pronto');
                        setStreamStatus('live');
                        break;

                    case 'offer':
                        // Recebeu oferta WebRTC do broadcaster
                        console.log('📨 Recebeu oferta WebRTC');
                        await handleOffer(data.offer);
                        break;

                    case 'ice-candidate':
                        // Recebeu ICE candidate do broadcaster
                        console.log('🧊 Recebeu ICE candidate');
                        await handleIceCandidate(data.candidate);
                        break;

                    case 'stream-ended':
                        console.log('🛑 Stream encerrado');
                        setStreamStatus('ended');
                        closePeerConnection();
                        if (onStreamEnd) onStreamEnd();
                        break;

                    case 'viewer-count':
                    case 'viewer-count-updated':
                        console.log('👥 Contagem de viewers atualizada:', data.count);
                        setViewerCount(data.count || 0);
                        break;

                    case 'stream-error':
                        console.error('❌ Erro no stream');
                        setStreamStatus('error');
                        closePeerConnection();
                        break;

                    default:
                        console.log('❓ Mensagem desconhecida:', data.type);
                        break;
                }
            }
        });
    }, [onMessage, onStreamEnd]);

    /**
     * Cria e configura a peer connection
     */
    const createPeerConnection = () => {
        if (peerConnectionRef.current) {
            console.log('⚠️ PeerConnection já existe');
            return peerConnectionRef.current;
        }

        console.log('🔗 Criando PeerConnection...');
        const pc = new RTCPeerConnection(iceServers);
        peerConnectionRef.current = pc;

        // Quando receber track do broadcaster
        pc.ontrack = (event) => {
            console.log('🎥 Recebeu track:', event.track.kind, 'enabled:', event.track.enabled, 'readyState:', event.track.readyState);
            console.log('📺 Streams disponíveis:', event.streams.length);
            
            if (videoRef.current && event.streams[0]) {
                const stream = event.streams[0];
                console.log('📺 Stream ID:', stream.id);
                console.log('📺 Tracks no stream:', stream.getTracks().map(t => `${t.kind}: ${t.enabled}`));
                
                videoRef.current.srcObject = stream;
                videoRef.current.volume = volume / 100;
                console.log('✅ Stream anexado ao vídeo');
                
                // Tenta play imediatamente
                const playVideo = () => {
                    videoRef.current.muted = false;
                    videoRef.current.play().then(() => {
                        console.log('▶️ Vídeo e áudio iniciados automaticamente');
                        setStreamStatus('live');
                        setIsMuted(false);
                    }).catch(err => {
                        console.warn('⚠️ Autoplay com áudio bloqueado, tentando mutado:', err.message);
                        videoRef.current.muted = true;
                        setIsMuted(true);
                        videoRef.current.play().then(() => {
                            console.log('▶️ Vídeo iniciado mutado - use o controle para ativar áudio');
                            setStreamStatus('live');
                        }).catch(err2 => {
                            console.error('❌ Erro ao iniciar vídeo:', err2);
                        });
                    });
                };
                
                setTimeout(playVideo, 100);
            }
        };

        // Quando ICE candidate for gerado
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('🧊 Enviando ICE candidate ao broadcaster');
                sendMessage({
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };

        // Monitora estado da conexão
        pc.onconnectionstatechange = () => {
            console.log('🔌 Connection state:', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setStreamStatus('live');
            } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
                setStreamStatus('error');
            }
        };

        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE connection state:', pc.iceConnectionState);
        };

        return pc;
    };

    /**
     * Processa oferta WebRTC do broadcaster
     */
    const handleOffer = async (offer) => {
        try {
            const pc = createPeerConnection();

            console.log('📝 Setando remote description (offer)');
            await pc.setRemoteDescription(new RTCSessionDescription(offer));

            console.log('💬 Criando answer com configurações de alta qualidade');
            const answer = await pc.createAnswer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });

            // Otimiza SDP para melhor qualidade de áudio
            const optimizedSdp = optimizeAudioSDP(answer.sdp);
            answer.sdp = optimizedSdp;

            await pc.setLocalDescription(answer);

            console.log('📤 Enviando answer ao broadcaster');
            sendMessage({
                type: 'answer',
                answer: answer
            });

            // Adiciona ICE candidates que chegaram antes da oferta
            if (iceCandidatesQueueRef.current.length > 0) {
                console.log('🧊 Adicionando ICE candidates da fila:', iceCandidatesQueueRef.current.length);
                for (const candidate of iceCandidatesQueueRef.current) {
                    await pc.addIceCandidate(new RTCIceCandidate(candidate));
                }
                iceCandidatesQueueRef.current = [];
            }
        } catch (error) {
            console.error('❌ Erro ao processar oferta:', error);
            setStreamStatus('error');
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

                // Parâmetros otimizados para máxima qualidade de áudio:
                // maxaveragebitrate: 510000 (510kbps - máxima qualidade Opus)
                // stereo: áudio estéreo
                // sprop-stereo: sinaliza suporte a estéreo
                // maxplaybackrate: 48000 (48kHz - qualidade CD)
                // minptime: 10ms (latência mínima)
                // maxptime: 60ms (buffer máximo)
                // useinbandfec: correção de erros
                // usedtx: 0 (desabilitado para melhor qualidade)
                optimizedLines.push(
                    `a=fmtp:${codecId} maxaveragebitrate=510000;stereo=1;sprop-stereo=1;maxplaybackrate=48000;minptime=10;maxptime=60;useinbandfec=1;usedtx=0`
                );
                console.log('🎵 Áudio otimizado: Opus 510kbps estéreo 48kHz (máxima qualidade)');
            }
        }

        return optimizedLines.join('\r\n');
    };

    /**
     * Processa ICE candidate do broadcaster
     */
    const handleIceCandidate = async (candidate) => {
        try {
            const pc = peerConnectionRef.current;
            
            if (pc && pc.remoteDescription) {
                console.log('🧊 Adicionando ICE candidate');
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
            } else {
                console.log('⏳ Remote description ainda não está pronta, guardando ICE candidate');
                iceCandidatesQueueRef.current.push(candidate);
            }
        } catch (error) {
            console.error('❌ Erro ao adicionar ICE candidate:', error);
        }
    };

    /**
     * Fecha a peer connection
     */
    const closePeerConnection = () => {
        if (peerConnectionRef.current) {
            console.log('🔌 Fechando PeerConnection');
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        iceCandidatesQueueRef.current = [];
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                await containerRef.current?.requestFullscreen();
                setIsFullscreen(true);
            } else {
                await document.exitFullscreen();
                setIsFullscreen(false);
            }
        } catch (error) {
            console.error('Erro ao alternar fullscreen:', error);
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, []);

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    const handleVolumeChange = (newVolume) => {
        if (videoRef.current) {
            const volumeValue = newVolume / 100;
            videoRef.current.volume = volumeValue;
            setVolume(newVolume);
            
            // Desmuta automaticamente se aumentar o volume
            if (newVolume > 0 && videoRef.current.muted) {
                videoRef.current.muted = false;
                setIsMuted(false);
            }
            
            // Muta se volume for 0
            if (newVolume === 0) {
                videoRef.current.muted = true;
                setIsMuted(true);
            }
        }
    };

    // Cleanup ao desmontar
    useEffect(() => {
        return () => {
            console.log('🧹 Cleanup - fechando conexões');
            closePeerConnection();
            disconnect();
        };
    }, [disconnect]);

    return (
        <div className="livestream-viewer" ref={containerRef}>
            <div className="viewer-video-container">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted={isMuted}
                    className="viewer-video"
                />

                {streamStatus === 'live' && (
                    <div className="viewer-badge">
                        <span className="live-indicator">● AO VIVO</span>
                        <span className="viewer-count">👥 {viewerCount}</span>
                    </div>
                )}

                {(streamStatus === 'connecting' || streamStatus === 'waiting') && (
                    <div className="status-overlay">
                        <div className="spinner"></div>
                        <p>{streamStatus === 'connecting' ? 'Conectando...' : 'Aguardando transmissão...'}</p>
                    </div>
                )}

                {streamStatus === 'ended' && (
                    <div className="status-overlay">
                        <p>Transmissão encerrada</p>
                    </div>
                )}

                {streamStatus === 'error' && (
                    <div className="status-overlay">
                        <p>Erro na transmissão</p>
                    </div>
                )}

                <div className="viewer-controls">
                    <button 
                        onClick={toggleMute} 
                        className={`control-button ${isMuted ? 'muted' : ''}`}
                        title={isMuted ? "Ativar Áudio" : "Mutar Áudio"}
                    >
                        {isMuted ? <FaVolumeMute size={24} /> : <FaVolumeUp size={24} />}
                    </button>
                    
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => handleVolumeChange(Number(e.target.value))}
                        className="volume-slider-horizontal"
                        title={`Volume: ${volume}%`}
                    />
                    
                    <span className="volume-text">{volume}%</span>
                    
                    <button 
                        onClick={toggleFullscreen} 
                        className="control-button"
                        title={isFullscreen ? "Sair da Tela Cheia" : "Tela Cheia"}
                    >
                        {isFullscreen ? <FaCompress size={24} /> : <FaExpand size={24} />}
                    </button>
            </div>
            </div>
        </div>
    );
};

export default LiveStreamViewer;
