"use client";

import { useEffect, useRef, useState } from "react";

type Item = {
  id: number;
  src: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
};

export function BouncingSouvenirs({ images }: { images: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<Item[]>([]);
  const [, setTick] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const setupItems = () => {
      if (!containerRef.current) return;
      const isDesktop = window.innerWidth >= 900;
      const activeImages = isDesktop ? images : images.slice(0, 2);

      // Only re-initialize if the number of images needs to change
      if (itemsRef.current.length === activeImages.length && itemsRef.current.length > 0) {
        return;
      }

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      const size = activeImages.length > 2 ? 90 : 120;

      itemsRef.current = activeImages.map((src, i) => {
        // Space them out initially to avoid massive overlaps on spawn
        const startX = (i % 3) * (size + 20) + Math.random() * 20;
        const startY = Math.floor(i / 3) * (size + 20) + Math.random() * 20;
        
        return {
          id: i,
          src,
          x: Math.min(startX, Math.max(0, width - size)),
          y: Math.min(startY, Math.max(0, height - size)),
          vx: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5),
          vy: (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.5),
          width: size,
          height: size,
        };
      });
    };

    setupItems();

    window.addEventListener("resize", setupItems);

    let animationFrameId: number;

    const animate = () => {
      if (!containerRef.current) return;
      const cWidth = containerRef.current.clientWidth;
      const cHeight = containerRef.current.clientHeight;
      const items = itemsRef.current;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        item.x += item.vx;
        item.y += item.vy;

        // Bounce off walls
        if (item.x <= 0) {
          item.x = 0;
          item.vx *= -1;
        } else if (item.x + item.width >= cWidth) {
          item.x = cWidth - item.width;
          item.vx *= -1;
        }

        if (item.y <= 0) {
          item.y = 0;
          item.vy *= -1;
        } else if (item.y + item.height >= cHeight) {
          item.y = cHeight - item.height;
          item.vy *= -1;
        }

        // Circle collision with other items to resolve overlaps smoothly
        for (let j = i + 1; j < items.length; j++) {
          const other = items[j];
          
          const r1 = item.width / 2 - 5; // slightly smaller radius for visual overlap tolerance
          const r2 = other.width / 2 - 5;
          
          const cx1 = item.x + item.width / 2;
          const cy1 = item.y + item.height / 2;
          const cx2 = other.x + other.width / 2;
          const cy2 = other.y + other.height / 2;
          
          let dx = cx1 - cx2;
          let dy = cy1 - cy2;
          let distance = Math.sqrt(dx * dx + dy * dy);
          const minDist = r1 + r2;

          if (distance < minDist) {
            // Prevent division by zero if perfectly overlapping
            if (distance === 0) {
              dx = Math.random() - 0.5;
              dy = Math.random() - 0.5;
              distance = Math.sqrt(dx * dx + dy * dy);
            }
            
            const angle = Math.atan2(dy, dx);
            const overlap = minDist - distance;
            
            // Push them apart half the overlap each
            const pushX = (Math.cos(angle) * overlap) / 2;
            const pushY = (Math.sin(angle) * overlap) / 2;
            
            item.x += pushX;
            item.y += pushY;
            other.x -= pushX;
            other.y -= pushY;
            
            // Swap velocities (elastic collision approximation)
            const tempVx = item.vx;
            const tempVy = item.vy;
            item.vx = other.vx;
            item.vy = other.vy;
            other.vx = tempVx;
            other.vy = tempVy;
          }
        }
      }

      setTick(t => t + 1); // Trigger re-render
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", setupItems);
    };
  }, [images]);

  return (
    <div ref={containerRef} style={{ position: "absolute", inset: 0, overflow: "hidden", zIndex: 2 }}>
      {itemsRef.current.map((item) => (
        <img
          key={item.id}
          src={item.src}
          alt="Bouncing souvenir"
          style={{
            position: "absolute",
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            objectFit: "contain",
            filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.3))",
            pointerEvents: "none",
            transition: "none",
            willChange: "transform",
            transform: "translate3d(0,0,0)",
          }}
        />
      ))}
    </div>
  );
}
