import React, { useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * TiltCard - A reusable premium 3D tilt component wrapped with Framer Motion.
 * Captures mouse movements inside its bounding box to apply smooth, 3D hardware-accelerated
 * transforms along with a dynamic glossy glare shine reflection overlay.
 */
export const TiltCard = ({ children, className = '', maxTilt = 10, ...props }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Motion values for tilt angles
  const rotateXVal = useMotionValue(0);
  const rotateYVal = useMotionValue(0);

  // Motion values for glare coordinates
  const glareX = useMotionValue(0);
  const glareY = useMotionValue(0);
  const glareOpacity = useMotionValue(0);

  // High-performance spring dampers to smooth out the motion
  const rotateSpringConfig = { damping: 25, stiffness: 200, mass: 0.5 };
  const rotateX = useSpring(rotateXVal, rotateSpringConfig);
  const rotateY = useSpring(rotateYVal, rotateSpringConfig);

  const glareSpringConfig = { damping: 40, stiffness: 300 };
  const sGlareX = useSpring(glareX, glareSpringConfig);
  const sGlareY = useSpring(glareY, glareSpringConfig);
  const sGlareOpacity = useSpring(glareOpacity, { damping: 30, stiffness: 200 });

  // Convert glare coordinates to radial-gradient backdrops
  const glareBackground = useTransform(
    [sGlareX, sGlareY, sGlareOpacity],
    ([x, y, opacity]) => `radial-gradient(circle 180px at ${x}px ${y}px, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 80%), radial-gradient(circle 250px at ${x}px ${y}px, var(--glow-color) 0%, rgba(255, 255, 255, 0) 100%)`
  );

  const handleMouseMove = (e) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Mouse coordinates relative to card center
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Normalize coordinates (-0.5 to 0.5)
    const normalizedX = (x / width) - 0.5;
    const normalizedY = (y / height) - 0.5;

    // Apply tilt values (rotateX is driven by Y-movement, rotateY by X-movement)
    rotateXVal.set(normalizedY * -maxTilt);
    rotateYVal.set(normalizedX * maxTilt);

    // Apply glare positions
    glareX.set(x);
    glareY.set(y);
    glareOpacity.set(0.85);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    
    // Smoothly spring back to flat resting state
    rotateXVal.set(0);
    rotateYVal.set(0);
    glareOpacity.set(0);
  };

  return (
    <div className="perspective-container w-full h-full">
      <motion.div
        className={`glass-panel transform-3d relative w-full h-full select-none cursor-pointer overflow-hidden ${className}`}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {/* Hardware-accelerated dynamic glossy glare overlay */}
        <motion.div 
          className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300"
          style={{ 
            background: glareBackground,
            opacity: sGlareOpacity 
          }} 
        />
        
        {/* Card Content wrapper */}
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </motion.div>
    </div>
  );
};
