import { useEffect, useRef } from 'react';
import { useWeatherTheme } from '../hooks/useWeatherTheme';

/**
 * WeatherAtmosphere - A lightweight, high-performance HTML5 Canvas backdrop.
 * Renders fluid, 60 FPS responsive animations synchronized with the current active city's
 * weather state (clear, cloudy, rainy, stormy, snowy) and the active appearance theme (light, dark).
 */
export const WeatherAtmosphere = ({ enabled = true }) => {
  const canvasRef = useRef(null);
  const { weather, theme } = useWeatherTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !enabled) return;

    const ctx = canvas.getContext('2d');
    let animationId;
    let particles = [];
    const maxParticles = weather === 'stormy' ? 120 : weather === 'rainy' ? 100 : weather === 'snowy' ? 80 : 25;

    // Lightning parameters for stormy weather
    let lightningFlash = 0;
    let nextLightningTime = Date.now() + 4000 + Math.random() * 6000;

    // Solar flare rotation for clear weather
    let solarAngle = 0;

    // Handle high-DPI scaling (reset transforms then scale to DPR)
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      if (typeof ctx.resetTransform === 'function') ctx.resetTransform();
      else ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initParticles(rect.width, rect.height);
    };

    // Initialize particles based on weather type
    const initParticles = (width, height) => {
      particles = [];
      for (let i = 0; i < maxParticles; i++) {
        if (weather === 'rainy' || weather === 'stormy') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            length: 12 + Math.random() * 15,
            speed: 15 + Math.random() * 12,
            opacity: 0.15 + Math.random() * 0.25,
            weight: 1.5 + Math.random() * 2
          });
        } else if (weather === 'snowy') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height - height,
            r: 1.5 + Math.random() * 3.5,
            d: Math.random() * maxParticles,
            speed: 0.8 + Math.random() * 1.5,
            swingSpeed: 0.01 + Math.random() * 0.02,
            swingRange: 15 + Math.random() * 20,
            opacity: 0.25 + Math.random() * 0.35
          });
        } else if (weather === 'cloudy') {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            r: 80 + Math.random() * 120,
            speed: 0.15 + Math.random() * 0.25,
            opacity: theme === 'dark' ? 0.03 : 0.04
          });
        }
      }
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Adaptive animation: respects prefers-reduced-motion and document visibility.
    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
    let reducedMotion = prefersReducedMotion ? prefersReducedMotion.matches : false;

    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(navigator.userAgent || '');
    const targetFps = isMobile ? 30 : 60;
    const frameInterval = 1000 / targetFps;

    const animateFrame = (width, height, isDark) => {
      // --- 1. RENDER RAIN & STORMY TELEMETRY ---
      if (weather === 'rainy' || weather === 'stormy') {
        if (isDark) {
          ctx.strokeStyle = weather === 'stormy' ? 'rgba(167, 139, 250, 0.45)' : 'rgba(147, 197, 253, 0.4)';
        } else {
          ctx.strokeStyle = weather === 'stormy' ? 'rgba(124, 58, 237, 0.4)' : 'rgba(37, 99, 235, 0.35)';
        }
        ctx.lineWidth = 1.3;
        ctx.lineCap = 'round';

        particles.forEach((p) => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 2, p.y + p.length);
          ctx.stroke();

          p.y += p.speed;
          p.x -= 0.5;

          if (p.y > height) {
            p.y = -p.length;
            p.x = Math.random() * width;
          }
        });

        if (weather === 'stormy') {
          const now = Date.now();
          if (now > nextLightningTime) {
            lightningFlash = 0.95;
            nextLightningTime = now + 5000 + Math.random() * 9000;
          }
          if (lightningFlash > 0) {
            if (isDark) {
              ctx.fillStyle = `rgba(139, 92, 246, ${lightningFlash * 0.09})`;
            } else {
              ctx.fillStyle = `rgba(30, 27, 75, ${lightningFlash * 0.12})`;
            }
            ctx.fillRect(0, 0, width, height);
            lightningFlash -= 0.06;
            if (lightningFlash < 0.3 && Math.random() > 0.95) {
              lightningFlash = 0.85;
            }
          }
        }
      }

      // --- 2. RENDER SNOWY TELEMETRY ---
      else if (weather === 'snowy') {
        ctx.fillStyle = isDark ? '#ffffff' : 'rgba(14, 165, 233, 0.75)';
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2, true);
          ctx.fill();
          p.y += p.speed;
          p.d += p.swingSpeed;
          p.x += Math.sin(p.d) * 0.4;
          if (p.y > height || p.x > width || p.x < 0) {
            p.y = -10;
            p.x = Math.random() * width;
          }
        });
      }

      // --- 3. RENDER CLOUDY BACKGROUND MISTS ---
      else if (weather === 'cloudy') {
        ctx.fillStyle = isDark ? 'rgba(71, 85, 105, 1)' : 'rgba(100, 116, 139, 1)';
        particles.forEach((p) => {
          ctx.beginPath();
          ctx.globalAlpha = p.opacity;
          const gradient = ctx.createRadialGradient(p.x, p.y, p.r * 0.1, p.x, p.y, p.r);
          gradient.addColorStop(0, isDark ? 'rgba(71, 85, 105, 0.45)' : 'rgba(148, 163, 184, 0.12)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
          p.x += p.speed;
          if (p.x - p.r > width) {
            p.x = -p.r;
            p.y = Math.random() * height;
          }
        });
      }

      // --- 4. RENDER CLEAR SOLAR FLARE CORONA ---
      else if (weather === 'clear') {
        solarAngle += 0.0012;
        ctx.beginPath();
        const solarX = width * 0.88;
        const solarY = height * 0.15;
        const baseRadius = 240;
        const pulseRadius = baseRadius + Math.sin(solarAngle * 5) * 12;
        const solarGrad = ctx.createRadialGradient(solarX, solarY, 0, solarX, solarY, pulseRadius);
        if (isDark) {
          solarGrad.addColorStop(0, 'rgba(56, 189, 248, 0.16)');
          solarGrad.addColorStop(0.3, 'rgba(99, 102, 241, 0.05)');
          solarGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        } else {
          solarGrad.addColorStop(0, 'rgba(245, 158, 11, 0.32)');
          solarGrad.addColorStop(0.4, 'rgba(251, 113, 133, 0.08)');
          solarGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        }
        ctx.fillStyle = solarGrad;
        ctx.arc(solarX, solarY, pulseRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1.0;
    };

    // Loop runner that caps FPS and respects reduced-motion/visibility
    let lastTime = performance.now();
    const loop = (now) => {
      animationId = requestAnimationFrame(loop);
      const delta = now - lastTime;
      if (delta < frameInterval) return;
      lastTime = now - (delta % frameInterval);

      const width = canvas.width / (window.devicePixelRatio || 1);
      const height = canvas.height / (window.devicePixelRatio || 1);
      const isDark = theme === 'dark';

      ctx.clearRect(0, 0, width, height);
      animateFrame(width, height, isDark);
    };

    const onPrefersChange = (e) => {
      reducedMotion = e.matches;
      if (reducedMotion && animationId) cancelAnimationFrame(animationId);
      if (!reducedMotion) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(loop);
      }
    };

    if (prefersReducedMotion && typeof prefersReducedMotion.addEventListener === 'function') {
      prefersReducedMotion.addEventListener('change', onPrefersChange);
    }

    const onVisibilityChange = () => {
      if (document.hidden) {
        if (animationId) cancelAnimationFrame(animationId);
        animationId = null;
      } else if (!reducedMotion && !animationId) {
        lastTime = performance.now();
        animationId = requestAnimationFrame(loop);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    // Start either a single static frame (reduced motion) or the animated loop
    if (reducedMotion) {
      // draw a single subtle frame
      resizeCanvas();
      animateFrame(canvas.width / (window.devicePixelRatio || 1), canvas.height / (window.devicePixelRatio || 1), theme === 'dark');
    } else {
      lastTime = performance.now();
      animationId = requestAnimationFrame(loop);
    }

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (prefersReducedMotion && typeof prefersReducedMotion.removeEventListener === 'function') {
        prefersReducedMotion.removeEventListener('change', onPrefersChange);
      }
    };
  }, [weather, theme, enabled]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0 transition-opacity duration-1000"
      style={{ mixBlendMode: theme === 'dark' ? 'screen' : 'normal' }}
    />
  );
};
