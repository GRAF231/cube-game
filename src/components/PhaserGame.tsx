import React, { useEffect, useRef } from 'react';
import { Game } from '../game/Game';

interface PhaserGameProps {
    containerClassName?: string;
}

/**
 * React-компонент, который интегрирует Phaser-игру в приложение
 */
const PhaserGame: React.FC<PhaserGameProps> = ({ containerClassName = 'phaser-container' }) => {
    const gameInstanceRef = useRef<Game | null>(null);
    const gameContainerId = 'phaser-game';

    useEffect(() => {
        if (!gameInstanceRef.current) {
            gameInstanceRef.current = new Game(gameContainerId);
        }

        return () => {
            if (gameInstanceRef.current) {
                gameInstanceRef.current.destroy();
                gameInstanceRef.current = null;
            }
        };
    }, []);

    return (
        <div className={containerClassName}>
            <div id={gameContainerId} />
        </div>
    );
};

export default PhaserGame;
