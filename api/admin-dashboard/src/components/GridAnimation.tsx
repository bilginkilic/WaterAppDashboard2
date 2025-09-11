import React, { useEffect, useRef } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { Box } from '@mui/material';

const pulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.2;
    box-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
  }
  50% {
    transform: scale(1.2);
    opacity: 0.9;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.6);
  }
  100% {
    transform: scale(1);
    opacity: 0.2;
    box-shadow: 0 0 2px rgba(255, 255, 255, 0.2);
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
  backgroundColor: 'rgba(255, 255, 255, 0.05)', // Beyaz taban rengi
  borderRadius: '2px',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.2) 100%)',
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&.active': {
    animation: `${pulse} 2s infinite ease-in-out`,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.3)',
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

    // Continuous wave animation with focused areas
    const animateWave = () => {
      const time = Date.now();
      cells.forEach((cell, index) => {
        const row = Math.floor(index / 20);
        const col = index % 20;
        
        // Üst kısımda daha aktif bölge (header)
        const topActive = row < 5 && Math.random() < 0.03;
        
        // Orta kısımda login formu etrafında aktif bölge
        const centerRow = Math.abs(row - 10);
        const centerCol = Math.abs(col - 10);
        const centerActive = 
          centerRow < 4 && 
          centerCol < 4 && 
          Math.random() < 0.02;
        
        // Alt kısımda daha aktif bölge (footer)
        const bottomActive = row > 15 && Math.random() < 0.03;
        
        // Dalga efekti
        const distance = Math.sqrt(Math.pow(row - 10, 2) + Math.pow(col - 10, 2));
        const wave = Math.sin(distance * 0.5 - time * 0.002) + 1;
        const waveActive = wave > 1.8;
        
        if (topActive || centerActive || bottomActive || waveActive) {
          cell.classList.add('active');
          // Aktif hücreleri farklı sürelerde söndür
          const duration = 1000 + Math.random() * 2000;
          setTimeout(() => cell.classList.remove('active'), duration);
        }
        
        // Rastgele parıltı efekti (daha nadir)
        if (Math.random() < 0.0005) {
          cell.classList.add('active');
          setTimeout(() => cell.classList.remove('active'), 1500);
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
