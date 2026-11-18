'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { taiwanMap } from '../lib/taiwan-map.ts';
import outline from './taiwan-map-outline.json';

type MapPoint = [x: number, y: number];
type CityMarker = { name: string; point: MapPoint };
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

function drawCities(context: CanvasRenderingContext2D, cities: CityMarker[], seconds: number) {
  const travelled = (seconds - .3) * 2.1;
  context.globalAlpha = 1;
  context.beginPath();
  for (let index = 1; index < cities.length; index++) {
    const progress = Math.min(1, travelled - index + 1);
    if (progress <= 0) break;
    const [x, y] = cities[index - 1].point;
    const [endX, endY] = cities[index].point;
    context.moveTo(x, y);
    context.lineTo(x + (endX - x) * progress, y + (endY - y) * progress);
  }
  context.strokeStyle = '#b98048';
  context.lineWidth = 2;
  context.setLineDash([5, 6]);
  context.stroke();
  context.setLineDash([]);

  context.font = '600 17px "Microsoft JhengHei", "PingFang TC", sans-serif';
  context.textBaseline = 'middle';
  for (const [index, { name, point: [x, y] }] of cities.entries()) {
    const arrival = travelled - index;
    if (arrival < 0) break;
    context.globalAlpha = Math.min(1, arrival * 2.8);
    const left = x < 340;
    context.beginPath();
    context.arc(x, y, 4.5, 0, 2 * Math.PI);
    context.fillStyle = '#ffe7b0';
    context.fill();
    context.strokeStyle = '#98663c';
    context.stroke();
    context.textAlign = left ? 'right' : 'left';
    context.fillText(name, x + (left ? -10 : 10), y);
    if (arrival < 1.4) {
      context.globalAlpha = .52 * (1 - arrival / 1.4);
      context.beginPath();
      context.arc(x, y, 5 + 8 * arrival, 0, 2 * Math.PI);
      context.strokeStyle = '#efb976';
      context.stroke();
    }
  }
  context.globalAlpha = 1;
}

export default function TaiwanConstellation({ libraries, cities }: { libraries: MapPoint[]; cities: CityMarker[] }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const target = canvas.current;
    const layer = document.createElement('canvas');
    layer.width = width;
    layer.height = height;
    const backdrop = layer.getContext('2d');
    const context = target?.getContext('2d');
    if (!target || !context || !backdrop) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let started: number | undefined;
    let visible = false;
    let ready = false;

    function render() {
      if (!target || !context || !backdrop) return;
      if (!ready) {
        drawMap(backdrop, libraries);
        const scale = Math.min(1.25, Math.max(.65, target.clientWidth * window.devicePixelRatio / width));
        target.width = Math.round(width * scale);
        target.height = Math.round(height * scale);
        context.scale(target.width / width, target.height / height);
        ready = true;
      }
      paint(performance.now());
    }

    function paint(now: number) {
      if (!context) return;
      started ??= now;
      const seconds = motion.matches || !visible ? 5 : (now - started) / 1000;
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
      drawCities(context, cities, seconds);
    }

    let observer: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(([entry]) => {
        visible = entry.intersectionRatio >= .16;
        cancelAnimationFrame(frame);
        if (visible) render();
      }, { threshold: .16 });
      observer.observe(target);
    } else {
      render();
    }
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [libraries, cities]);

  return <div className="coverage-rig" aria-hidden="true">
    {Array.from({ length: 8 }, (_, slice) =>
      <span className="coverage-slice" key={slice} style={{ '--slice': slice } as CSSProperties} />)}
    <canvas className="coverage-map" ref={canvas} width={width} height={height} />
  </div>;
}
