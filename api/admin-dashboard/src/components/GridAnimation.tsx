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
  gridTemplateColumns: 'repeat(2, 1fr)',
  gridTemplateRows: 'repeat(2, 1fr)',
  gap: '20px',
  padding: '20px',
  pointerEvents: 'none',
  zIndex: 0,
  background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(33,33,33,0.95) 100%)',
});

const GridSection = styled(Box)({
  position: 'relative',
  display: 'grid',
  gridTemplateColumns: 'repeat(10, 1fr)',
  gridTemplateRows: 'repeat(10, 1fr)',
  gap: '1px',
  padding: '1px',
  overflow: 'hidden',
  borderRadius: '8px',
  background: 'rgba(255, 255, 255, 0.02)',
});

const Message = styled(Box)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '0.9rem',
  textAlign: 'center',
  width: '80%',
  pointerEvents: 'none',
  textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  opacity: 0.7,
  fontFamily: 'system-ui, -apple-system, sans-serif',
  letterSpacing: '0.5px',
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

const messages = [
  "Her damla su, geleceğimiz için önemlidir.",
  "Sürdürülebilir bir dünya için su tasarrufu",
  "Su ayak izinizi azaltın, dünyayı koruyun",
  "Birlikte daha iyi bir gelecek için"
];

const GridAnimation: React.FC = () => {
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([null, null, null, null]);

  useEffect(() => {
    sectionRefs.current.forEach((section, sectionIndex) => {
      if (!section) return;

      const cells = Array.from(section.children).filter(child => child.classList.contains('grid-cell')) as HTMLElement[];
      
      // Initial fade-in animation
      cells.forEach((cell, index) => {
        const row = Math.floor(index / 10);
        const col = index % 10;
        const delay = (row + col) * 0.05;
        cell.style.animationDelay = `${delay}s`;
        cell.classList.add('initial-fade');
      });

      // Continuous animation for each section
      const animateSection = () => {
        const time = Date.now();
        cells.forEach((cell, index) => {
          const row = Math.floor(index / 10);
          const col = index % 10;
          
          // Her bölüm için farklı animasyon desenleri
          switch(sectionIndex) {
            case 0: // Sol üst - Yatay dalga
              const waveX = Math.sin(col * 0.5 - time * 0.001) + 1;
              if (waveX > 1.7) cell.classList.add('active');
              else cell.classList.remove('active');
              break;
              
            case 1: // Sağ üst - Dikey dalga
              const waveY = Math.sin(row * 0.5 - time * 0.001) + 1;
              if (waveY > 1.7) cell.classList.add('active');
              else cell.classList.remove('active');
              break;
              
            case 2: // Sol alt - Spiral
              const distanceFromCenter = Math.sqrt(Math.pow(row - 5, 2) + Math.pow(col - 5, 2));
              const spiral = Math.sin(distanceFromCenter - time * 0.002) + 1;
              if (spiral > 1.7) cell.classList.add('active');
              else cell.classList.remove('active');
              break;
              
            case 3: // Sağ alt - Rastgele parıltılar
              if (Math.random() < 0.002) {
                cell.classList.add('active');
                setTimeout(() => cell.classList.remove('active'), 1000 + Math.random() * 1000);
              }
              break;
          }
        });
        
        requestAnimationFrame(animateSection);
      };

      const animation = requestAnimationFrame(animateSection);
      return () => cancelAnimationFrame(animation);
    });
  }, []);

  return (
    <Container>
      {[0, 1, 2, 3].map((sectionIndex) => (
        <GridSection key={sectionIndex} ref={el => sectionRefs.current[sectionIndex] = el as HTMLDivElement}>
          {Array(100).fill(null).map((_, i) => (
            <GridCell key={i} className="grid-cell" />
          ))}
          <Message>{messages[sectionIndex]}</Message>
        </GridSection>
      ))}
    </Container>
  );
};

export default GridAnimation;
