'use client';

import { useEffect, useRef } from 'react';
import { taiwanMap } from '../lib/taiwan-map.ts';
import outline from './taiwan-map-outline.json';

type MapPoint = [x: number, y: number];
const { width, height } = taiwanMap;
const palette = ['#f7cc8a', '#bd7844', '#e8a969', '#9b9e73', '#f7dfae'];

function triangle(context: CanvasRenderingContext2D, x: number, y: number, size: number, angle: number) {
  const dx = Math.cos(angle) * size;
  const dy = Math.sin(angle) * size;
  context.beginPath();
  context.moveTo(x + dx, y + dy);
  context.lineTo(x - dx * .5 - dy * .87, y - dy * .5 + dx * .87);
  context.lineTo(x - dx * .5 + dy * .87, y - dy * .5 - dx * .87);
  context.closePath();
}

function drawMap(context: CanvasRenderingContext2D, libraries: MapPoint[]) {
  const land = new Path2D(outline.land);
  const coast = new Path2D(outline.coast);
  context.fill(land);
  const landMask = context.getImageData(0, 0, width, height).data;
  context.clearRect(0, 0, width, height);
  let seed = 1488;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const halo = context.createRadialGradient(334, 296, 35, 334, 296, 252);
  halo.addColorStop(0, 'rgba(196, 115, 55, .18)');
  halo.addColorStop(1, 'rgba(196, 115, 55, 0)');
  context.fillStyle = halo;
  context.fillRect(0, 0, width, height);

  for (let i = 0; i < 180; i++) {
    const x = 30 + random() * (width - 60);
    const y = 25 + random() * (height - 50);
    context.globalAlpha = .08 + random() * .46;
    context.fillStyle = palette[i % palette.length];
    triangle(context, x, y, .5 + random() * 1.5, random() * Math.PI);
    context.fill();
  }

  context.globalAlpha = .12;
  context.fillStyle = '#c9773e';
  context.fill(land);
  context.globalAlpha = .45;
  context.lineWidth = .65;
  context.strokeStyle = '#bd7844';
  context.stroke(coast);

  for (let row = 34; row < height; row += 3.7) {
    for (let column = 65; column < width - 55; column += 3.7) {
      const x = column + (random() - .5) * 3.6;
      const y = row + (random() - .5) * 3.6;
      if (landMask[(Math.floor(y) * width + Math.floor(x)) * 4 + 3] < 128) continue;
      const color = palette[Math.floor(random() * palette.length)];
      context.globalAlpha = .24 + random() * .56;
      triangle(context, x, y, .6 + random() * 1.2, random() * Math.PI);
      if (random() < .5) {
        context.strokeStyle = color;
        context.stroke();
      } else {
        context.fillStyle = color;
        context.fill();
      }
    }
  }

  context.fillStyle = '#ffe7b0';
  context.globalAlpha = .64;
  for (const [x, y] of libraries) {
    context.beginPath();
    context.arc(x, y, 1.26, 0, 2 * Math.PI);
    context.fill();
  }
  context.globalAlpha = 1;
}

export default function TaiwanConstellation({ libraries }: { libraries: MapPoint[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = canvas.current;
    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    const backdrop = layer.getContext('2d');
    const context = target?.getContext('2d');
    if (!target || !context || !backdrop) return;
    drawMap(backdrop, libraries);

    const scale = Math.min(window.devicePixelRatio || 1, 2);
    target.width = width * scale;
    target.height = height * scale;
    context.scale(scale, scale);
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const bounds = target.getBoundingClientRect();
    const inView = bounds.top < window.innerHeight && bounds.bottom > 0;
    let frame = 0;
    let started: number | undefined;

    function paint(now: number) {
      if (!context) return;
      started ??= now;
      const seconds = motion.matches || !inView ? 5 : (now - started) / 1000;
      context.clearRect(0, 0, width, height);
      context.globalAlpha = .36 + .64 * Math.min(1, seconds / .85);
      context.drawImage(layer, 0, 0);
      if (seconds < 4.5) {
        context.fillStyle = '#fff0c7';
        for (let i = 0; i < libraries.length; i += 17) {
          const [x, y] = libraries[i];
          const gleam = Math.max(0, Math.sin(i + seconds * 2.8)) * Math.min(1, 4.5 - seconds);
          context.globalAlpha = gleam * .7;
          context.beginPath();
          context.arc(x, y, 1.5 + gleam * 1.7, 0, 2 * Math.PI);
          context.fill();
        }
        frame = requestAnimationFrame(paint);
      }
      context.globalAlpha = 1;
    }

    paint(performance.now());
    return () => cancelAnimationFrame(frame);
  }, [libraries]);

  return <canvas className="search-map" ref={canvas} width={width} height={height} aria-hidden="true" />;
}
