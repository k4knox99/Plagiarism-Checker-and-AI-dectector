import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from 'framer-motion';

interface PerspectiveTiltCardProps {
  children: React.ReactNode;
  backContent?: React.ReactNode;
  isFlipped?: boolean;
  className?: string;
  maxTilt?: number;
  enableGlare?: boolean;
}

export const PerspectiveTiltCard: React.FC<PerspectiveTiltCardProps> = ({
  children,
  backContent,
  isFlipped = false,
  className = '',
  maxTilt = 8,
  enableGlare = true
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Raw mouse coordinates normalized from -0.5 to 0.5
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for natural tactile inertia
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  // 3D Rotation transformations
  const rotateX = useTransform(smoothMouseY, [-0.5, 0.5], [maxTilt, -maxTilt]);
  const rotateY = useTransform(smoothMouseX, [-0.5, 0.5], [-maxTilt, maxTilt]);

  // Glare position
  const glareX = useTransform(smoothMouseX, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(smoothMouseY, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <div style={{ perspective: 1000 }} className="w-full">
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        animate={{
          rotateY: isFlipped ? 180 : 0
        }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className={`relative transition-shadow duration-300 ${className}`}
      >
        {/* Dynamic Light Reflection / Glare */}
        {enableGlare && isHovered && !isFlipped && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none rounded-2xl opacity-15 overflow-hidden"
            style={{
              background: `radial-gradient(circle at ${glareX} ${glareY}, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 60%)`
            }}
          />
        )}

        {/* Front Face */}
        <div 
          style={{ backfaceVisibility: 'hidden' }}
          className={isFlipped ? 'pointer-events-none' : ''}
        >
          {children}
        </div>

        {/* Back Face (If 3D Flip Enabled) */}
        {backContent && (
          <div
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
            className={`absolute inset-0 ${!isFlipped ? 'pointer-events-none' : ''}`}
          >
            {backContent}
          </div>
        )}
      </motion.div>
    </div>
  );
};
