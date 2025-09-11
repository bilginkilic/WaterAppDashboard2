import React, { useEffect, useRef } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { Box } from '@mui/material';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
`;

const fadeInScale = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
`;

const Container = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'grid',
  gridTemplateColumns: 'repeat(20, 1fr)', // More squares for a denser grid
  gridTemplateRows: 'repeat(20, 1fr)',
  gap: '1px',
  padding: '1px',
  pointerEvents: 'none',
  zIndex: 0,
  background: 'linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(33,33,33,0.9) 100%)',
});

const GridCell = styled(Box)(({ theme }) => ({
  position: 'relative',
  backgroundColor: 'rgba(138, 43, 226, 0.2)', // Base purple color
  borderRadius: '2px',
  transition: 'background-color 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(138, 43, 226, 0.1) 0%, rgba(148, 0, 211, 0.2) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&.active': {
    animation: `${pulse} 2s infinite ease-in-out`,
    backgroundColor: 'rgba(138, 43, 226, 0.4)',
    '&::before': {
      opacity: 1,
    },
  },
  '&.initial-fade': {
    animation: `${fadeInScale} 0.5s forwards ease-out`,
  },
}));

const GridAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cells = Array.from(container.children) as HTMLElement[];
    
    // Initial fade-in animation
    cells.forEach((cell, index) => {
      const row = Math.floor(index / 20);
      const col = index % 20;
      const delay = (row + col) * 0.05; // Diagonal wave effect
      cell.style.animationDelay = `${delay}s`;
      cell.classList.add('initial-fade');
    });

    // Continuous wave animation
    const animateWave = () => {
      const time = Date.now();
      cells.forEach((cell, index) => {
        const row = Math.floor(index / 20);
        const col = index % 20;
        const distance = Math.sqrt(Math.pow(row - 10, 2) + Math.pow(col - 10, 2));
        const wave = Math.sin(distance * 0.5 - time * 0.002) + 1;
        
        if (wave > 1.7) {
          cell.classList.add('active');
        } else {
          cell.classList.remove('active');
        }
        
        // Random sparkle effect
        if (Math.random() < 0.001) {
          cell.classList.add('active');
          setTimeout(() => cell.classList.remove('active'), 2000);
        }
      });
      
      requestAnimationFrame(animateWave);
    };

    const animation = requestAnimationFrame(animateWave);
    return () => cancelAnimationFrame(animation);
  }, []);

  return (
    <Container ref={containerRef}>
      {Array(400).fill(null).map((_, i) => (
        <GridCell key={i} />
      ))}
    </Container>
  );
};

export default GridAnimation;
