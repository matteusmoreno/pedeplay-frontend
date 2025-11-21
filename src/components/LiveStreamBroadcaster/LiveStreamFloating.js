import React, { useState, useRef, useEffect } from 'react';
import { FaVideo, FaTimes, FaMinus, FaWindowMaximize } from 'react-icons/fa';
import LiveStreamBroadcaster from './LiveStreamBroadcaster';
import './LiveStreamFloating.css';

const LiveStreamFloating = ({ isOpen, onClose, showId, artistId }) => {
    const [isMinimized, setIsMinimized] = useState(false);
    const [position, setPosition] = useState(() => ({
        x: window.innerWidth - 420, // 400px width + 20px margin
        y: window.innerHeight - 520  // altura aproximada + margin
    }));
    const [size, setSize] = useState({ width: 400, height: 500 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const dragRef = useRef(null);
    const containerRef = useRef(null);
    const resizeRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleMouseMove = (e) => {
            if (isDragging) {
                const container = containerRef.current;
                if (!container) return;

                const newX = position.x + e.movementX;
                const newY = position.y + e.movementY;

                // Limites da tela
                const maxX = window.innerWidth - container.offsetWidth;
                const maxY = window.innerHeight - container.offsetHeight;

                setPosition({
                    x: Math.max(0, Math.min(newX, maxX)),
                    y: Math.max(0, Math.min(newY, maxY))
                });
            }
            
            if (isResizing) {
                const newWidth = Math.max(300, Math.min(800, size.width + e.movementX));
                const newHeight = Math.max(400, Math.min(800, size.height + e.movementY));
                
                setSize({
                    width: newWidth,
                    height: newHeight
                });
            }
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            setIsResizing(false);
            document.body.style.cursor = '';
        };

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, isResizing, position, size, isOpen]);

    const handleMouseDown = (e) => {
        if (e.target === dragRef.current || dragRef.current.contains(e.target)) {
            setIsDragging(true);
            document.body.style.cursor = 'grabbing';
        }
    };
    
    const handleResizeMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsResizing(true);
        document.body.style.cursor = 'nwse-resize';
    };

    const handleMouseUpGlobal = () => {
        if (isDragging) {
            setIsDragging(false);
            document.body.style.cursor = '';
        }
    };

    useEffect(() => {
        if (isDragging) {
            document.addEventListener('mouseup', handleMouseUpGlobal);
        }
        return () => {
            document.removeEventListener('mouseup', handleMouseUpGlobal);
            document.body.style.cursor = '';
        };
    }, [isDragging]);

    const toggleMinimize = () => {
        console.log('🔄 Toggling minimize. Current:', isMinimized, 'New:', !isMinimized);
        const newMinimized = !isMinimized;
        setIsMinimized(newMinimized);
        
        // Se minimizando, move para o canto inferior direito (só header visível)
        // Se maximizando, move para o canto inferior direito (janela completa)
        if (newMinimized) {
            setPosition({
                x: window.innerWidth - size.width - 20,
                y: window.innerHeight - 60 // Apenas altura do header
            });
        } else {
            setPosition({
                x: window.innerWidth - size.width - 20,
                y: window.innerHeight - size.height - 20 // Janela completa
            });
        }
    };

    if (!isOpen) return null;

    const containerStyle = isMinimized
        ? {
              transform: `translate(${position.x}px, ${position.y}px)`,
              width: `${size.width}px`,
              height: 'auto'
          }
        : {
              transform: `translate(${position.x}px, ${position.y}px)`,
              width: `${size.width}px`,
              height: `${size.height}px`
          };

    return (
        <div
            ref={containerRef}
            className="livestream-floating-container"
            style={containerStyle}
        >
            <div
                ref={dragRef}
                className="livestream-floating-header"
                onMouseDown={handleMouseDown}
                style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
            >
                <h3>
                    <FaVideo />
                    Transmissão ao Vivo
                </h3>
                <div className="livestream-floating-actions">
                    <button
                        className="floating-action-btn"
                        onClick={toggleMinimize}
                        title={isMinimized ? "Restaurar" : "Minimizar"}
                        type="button"
                    >
                        {isMinimized ? <FaWindowMaximize /> : <FaMinus />}
                    </button>
                </div>
            </div>
            <div className={`livestream-floating-content ${isMinimized ? 'minimized' : ''}`}>
                <LiveStreamBroadcaster showId={showId} artistId={artistId} />
            </div>
            {!isMinimized && (
                <div
                    ref={resizeRef}
                    className="resize-handle"
                    onMouseDown={handleResizeMouseDown}
                    title="Redimensionar"
                />
            )}
        </div>
    );
};

export default LiveStreamFloating;
