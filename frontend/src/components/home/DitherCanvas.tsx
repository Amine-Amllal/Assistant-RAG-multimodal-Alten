import { useEffect, useRef } from "react";
import "./DitherCanvas.css";

interface DitherCanvasProps {
  /** Animation speed multiplier — bump this on hover for a livelier feel. */
  speed?: number;
}

// Ordered (Bayer) dithering: a pixel is "on" when a slowly drifting wave field
// exceeds the threshold at that cell, producing the classic halftone-dot look
// without needing WebGL/shaders or any animation library.
const BAYER_4X4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
].map((row) => row.map((v) => v / 16));

const CELL_SIZE = 6;

export function DitherCanvas({ speed = 0.2 }: DitherCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const canvasEl = canvasRef.current;
    const ctx = canvasEl?.getContext("2d");
    if (!canvasEl || !ctx) return;
    const canvas = canvasEl;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      width = canvas.width = Math.ceil(rect.width);
      height = canvas.height = Math.ceil(rect.height);
      cols = Math.ceil(width / CELL_SIZE);
      rows = Math.ceil(height / CELL_SIZE);
    }
    resize();

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);

    let frameId = 0;
    let t = 0;

    function draw() {
      ctx!.clearRect(0, 0, width, height);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const nx = x / cols;
          const ny = y / rows;
          const wave = Math.sin((nx * 6 + t) * 1.3) * Math.cos((ny * 6 - t * 0.8) * 1.1) * 0.5 + 0.5;
          const threshold = BAYER_4X4[y % 4][x % 4];
          if (wave > threshold) {
            const alpha = Math.min(0.16, wave - threshold + 0.04);
            ctx!.fillStyle = `rgba(226, 0, 26, ${alpha})`;
            ctx!.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE - 1, CELL_SIZE - 1);
          }
        }
      }
      if (!prefersReducedMotion) {
        t += 0.02 * speedRef.current;
        frameId = requestAnimationFrame(draw);
      }
    }
    draw();

    return () => {
      resizeObserver.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="dither-canvas" aria-hidden="true" />;
}
