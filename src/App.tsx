/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Trophy, RefreshCcw, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Game Constants
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const INITIAL_DIRECTION = { x: 0, y: -1 }; // Moving UP initially
const INITIAL_SPEED = 150; // ms per tick

type Point = { x: number; y: number };

const generateFood = (snake: Point[]): Point => {
  let newFood: Point;
  let isOccupied = true;
  while (isOccupied) {
    newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    // eslint-disable-next-line no-loop-func
    isOccupied = snake.some((segment) => segment.x === newFood.x && segment.y === newFood.y);
  }
  return newFood!;
};

export default function App() {
  const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
  const [direction, setDirection] = useState<Point>(INITIAL_DIRECTION);
  const directionRef = useRef(INITIAL_DIRECTION); // Used to prevent rapid overlapping keypresses
  
  const [food, setFood] = useState<Point>({ x: 5, y: 5 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  
  const [gameOver, setGameOver] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(INITIAL_SPEED);

  // Initialize food properly on mount
  useEffect(() => {
    setFood(generateFood(INITIAL_SNAKE));
    const savedHighScore = localStorage.getItem('snakeHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore, 10));
    }
  }, []);

  const resetGame = () => {
    setSnake(INITIAL_SNAKE);
    setDirection(INITIAL_DIRECTION);
    directionRef.current = INITIAL_DIRECTION;
    setScore(0);
    setGameOver(false);
    setIsStarted(true);
    setIsPaused(false);
    setSpeed(INITIAL_SPEED);
    setFood(generateFood(INITIAL_SNAKE));
  };

  const startGame = () => {
    resetGame();
  };

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Prevent default scrolling for arrow keys and Space
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' && isStarted && !gameOver) {
        setIsPaused((p) => !p);
        return;
      }

      if (!isStarted || gameOver || isPaused) return;

      const { x: dx, y: dy } = directionRef.current;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (dy === 0) directionRef.current = { x: 0, y: -1 };
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (dy === 0) directionRef.current = { x: 0, y: 1 };
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (dx === 0) directionRef.current = { x: -1, y: 0 };
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (dx === 0) directionRef.current = { x: 1, y: 0 };
          break;
      }
    },
    [isStarted, gameOver, isPaused]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (!isStarted || gameOver || isPaused) return;

    const moveSnake = () => {
      setSnake((prevSnake) => {
        const head = prevSnake[0];
        const newHead = {
          x: head.x + directionRef.current.x,
          y: head.y + directionRef.current.y,
        };

        // Check Wall Collision
        if (
          newHead.x < 0 ||
          newHead.x >= GRID_SIZE ||
          newHead.y < 0 ||
          newHead.y >= GRID_SIZE
        ) {
          handleGameOver();
          return prevSnake;
        }

        // Check Self Collision
        if (prevSnake.some((segment) => segment.x === newHead.x && segment.y === newHead.y)) {
          handleGameOver();
          return prevSnake;
        }

        const newSnake = [newHead, ...prevSnake];

        // Check Food Collision
        if (newHead.x === food.x && newHead.y === food.y) {
          setScore((s) => {
            const newScore = s + 10;
            if (newScore > highScore) {
              setHighScore(newScore);
              localStorage.setItem('snakeHighScore', newScore.toString());
            }
            // Increase speed slightly
            setSpeed((spd) => Math.max(spd - 2, 50));
            return newScore;
          });
          setFood(generateFood(newSnake));
        } else {
          newSnake.pop(); // Remove tail if not eating
        }

        setDirection(directionRef.current);
        return newSnake;
      });
    };

    const intervalId = setInterval(moveSnake, speed);
    return () => clearInterval(intervalId);
  }, [isStarted, gameOver, isPaused, food, speed, highScore]);

  const handleGameOver = () => {
    setGameOver(true);
    setIsStarted(false);
  };

  return (
    <div className="min-h-screen bg-neutral-950 font-sans flex items-center justify-center p-4 selection:bg-emerald-500/30">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between text-neutral-200">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-sm animate-pulse" />
              Snake
            </h1>
            <p className="text-sm text-neutral-500 font-mono mt-1">Use WASD or Arrows</p>
          </div>
          
          <div className="flex gap-4">
            <div className="bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800/50 flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider">Score</span>
              <span className="font-mono font-medium text-emerald-400">{score.toString().padStart(4, '0')}</span>
            </div>
            <div className="bg-neutral-900 px-4 py-2 rounded-xl border border-neutral-800/50 flex flex-col items-end">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-500/80 flex items-center gap-1">
                <Trophy className="w-3 h-3" /> Best
              </span>
              <span className="font-mono font-medium text-amber-500">{highScore.toString().padStart(4, '0')}</span>
            </div>
          </div>
        </div>

        {/* Game Board Container */}
        <div className="relative aspect-square w-full bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl shadow-emerald-900/10 overflow-hidden">
          
          {/* Default state / Game Over Overlays */}
          <AnimatePresence>
            {!isStarted && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-neutral-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
              >
                {gameOver ? (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="space-y-4 flex flex-col items-center"
                  >
                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-2">
                      <RefreshCcw className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-1">Game Over</h2>
                      <p className="text-neutral-400">You scored <span className="text-emerald-400 font-mono">{score}</span> points</p>
                    </div>
                    <button
                      onClick={resetGame}
                      className="mt-4 px-6 py-3 bg-white hover:bg-neutral-200 text-black font-semibold rounded-xl transition-all active:scale-95 flex items-center gap-2"
                    >
                      <RefreshCcw className="w-4 h-4" /> Try Again
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <button
                      onClick={startGame}
                      className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-2xl transition-all active:scale-95 shadow-[0_0_40px_-10px] shadow-emerald-500 flex items-center gap-3 text-lg"
                    >
                      <Play className="w-5 h-5 fill-black" /> Start Game
                    </button>
                  </motion.div>
                )}
              </motion.div>
            )}

            {isPaused && isStarted && !gameOver && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-neutral-950/60 backdrop-blur-sm flex items-center justify-center"
              >
                <div className="bg-neutral-900/90 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 border border-neutral-700 shadow-xl">
                  <Pause className="w-4 h-4 text-emerald-400" /> Paused
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Render Grid GridLines (Optional for aesthetics) */}
          <div className="absolute inset-0 opacity-20 pointer-events-none grid"
               style={{ 
                 gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
                 gridTemplateRows: `repeat(${GRID_SIZE}, minmax(0, 1fr))`
               }}>
            {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
              <div key={i} className="border-[0.5px] border-neutral-700/30" />
            ))}
          </div>

          {/* Render Entities layer */}
          <div className="absolute inset-0">
            {/* Food */}
            <div
              className="absolute bg-amber-500 rounded-sm shadow-[0_0_15px_1px] shadow-amber-500/50"
              style={{
                width: `${100 / GRID_SIZE}%`,
                height: `${100 / GRID_SIZE}%`,
                left: `${(food.x / GRID_SIZE) * 100}%`,
                top: `${(food.y / GRID_SIZE) * 100}%`,
                transform: 'scale(0.8)', // Slight padding
              }}
            >
              <div className="w-full h-full bg-amber-400 rounded-sm animate-ping opacity-20" />
            </div>

            {/* Snake */}
            {snake.map((segment, index) => {
              const isHead = index === 0;
              return (
                <div
                  key={`${segment.x}-${segment.y}-${index}`}
                  className={`absolute rounded-sm ${
                    isHead ? 'bg-emerald-400 z-10' : 'bg-emerald-600/90'
                  }`}
                  style={{
                    width: `${100 / GRID_SIZE}%`,
                    height: `${100 / GRID_SIZE}%`,
                    left: `${(segment.x / GRID_SIZE) * 100}%`,
                    top: `${(segment.y / GRID_SIZE) * 100}%`,
                    // Making the body slightly smaller to show separation 
                    transform: isHead ? 'scale(0.95)' : 'scale(0.85)',
                    transition: 'all 0.05s linear' // Adds slight smoothness to position leaps
                  }}
                >
                  {isHead && (
                    <div className="w-full h-full relative">
                      {/* Optional: Add simple 'eyes' to snake head based on direction */}
                      <div className="absolute w-[20%] h-[20%] bg-neutral-950 rounded-full top-[20%] left-[20%]" />
                      <div className="absolute w-[20%] h-[20%] bg-neutral-950 rounded-full top-[20%] right-[20%]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Mobile controls spacer / info */}
        <div className="text-center text-xs text-neutral-600 font-mono tracking-wide">
          Press SPACE to pause/resume
        </div>
      </div>
    </div>
  );
}
