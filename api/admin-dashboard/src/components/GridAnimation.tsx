import React, { useEffect, useRef } from 'react';
import { styled, keyframes } from '@mui/material/styles';
import { Box } from '@mui/material';

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
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
  gridTemplateColumns: 'repeat(10, 1fr)',
  gridTemplateRows: 'repeat(10, 1fr)',
  gap: '2px',
  padding: '2px',
  pointerEvents: 'none',
  zIndex: 0,
});

const GridCell = styled(Box)({
  backgroundColor: 'rgba(128, 0, 255, 0.1)',
  borderRadius: '4px',
  animation: `${fadeIn} 0.5s ease-out forwards`,
  opacity: 0,
});

const GridAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cells = Array.from(container.children) as HTMLElement[];
    
    // Rastgele sırayla hücreleri göster
    cells.forEach((cell, index) => {
      const delay = Math.random() * 2; // 0-2 saniye arası rastgele gecikme
      cell.style.animationDelay = `${delay}s`;
      
      // Rastgele renk tonu
      const hue = Math.random() * 60 - 30; // -30 ile +30 arası
      const lightness = Math.random() * 20 + 10; // 10-30 arası
      cell.style.backgroundColor = `hsla(${270 + hue}, 70%, ${lightness}%, 0.15)`;
    });

    // Her 3 saniyede bir yeni animasyon
    const interval = setInterval(() => {
      cells.forEach((cell) => {
        const delay = Math.random() * 2;
        cell.style.animation = 'none';
        cell.offsetHeight; // Reflow
        cell.style.animation = `${fadeIn} 0.5s ease-out forwards ${delay}s`;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Container ref={containerRef}>
      {Array(100).fill(null).map((_, i) => (
        <GridCell key={i} />
      ))}
    </Container>
  );
};

export default GridAnimation;
