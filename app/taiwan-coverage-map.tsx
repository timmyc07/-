'use client';

import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import countyPaths from './taiwan-county-paths.json';

// The anchors use the same projection as the county shapes.
const annotations = [
  { city: '連江縣', longitude: 119.95, latitude: 26.16, rail: 'island', row: 70 },
  { city: '基隆市', longitude: 121.74, latitude: 25.13, rail: 'east', row: 100 },
  { city: '臺北市', longitude: 121.55, latitude: 25.07, rail: 'east', row: 130 },
  { city: '新北市', longitude: 121.47, latitude: 25.01, rail: 'east', row: 160 },
  { city: '桃園市', longitude: 121.30, latitude: 25.00, rail: 'west', row: 151 },
  { city: '新竹縣', longitude: 121.00, latitude: 24.83, rail: 'west', row: 180 },
  { city: '新竹市', longitude: 120.94, latitude: 24.80, rail: 'west', row: 209 },
  { city: '宜蘭縣', longitude: 121.74, latitude: 24.72, rail: 'east', row: 216 },
  { city: '苗栗縣', longitude: 120.82, latitude: 24.56, rail: 'west', row: 238 },
  { city: '金門縣', longitude: 118.32, latitude: 24.44, rail: 'island', row: 224 },
  { city: '臺中市', longitude: 120.68, latitude: 24.15, rail: 'west', row: 267 },
  { city: '彰化縣', longitude: 120.54, latitude: 24.07, rail: 'west', row: 296 },
  { city: '花蓮縣', longitude: 121.57, latitude: 23.97, rail: 'east', row: 282 },
  { city: '南投縣', longitude: 120.91, latitude: 23.90, rail: 'east', row: 331 },
  { city: '雲林縣', longitude: 120.45, latitude: 23.72, rail: 'west', row: 325 },
  { city: '澎湖縣', longitude: 119.57, latitude: 23.57, rail: 'west', row: 354 },
  { city: '嘉義縣', longitude: 120.29, latitude: 23.50, rail: 'west', row: 383 },
  { city: '嘉義市', longitude: 120.45, latitude: 23.48, rail: 'west', row: 412 },
  { city: '臺南市', longitude: 120.28, latitude: 23.14, rail: 'west', row: 441 },
  { city: '臺東縣', longitude: 121.13, latitude: 22.76, rail: 'east', row: 405 },
  { city: '高雄市', longitude: 120.30, latitude: 22.64, rail: 'west', row: 470 },
  { city: '屏東縣', longitude: 120.63, latitude: 22.42, rail: 'east', row: 479 },
] as const;

const grain = Array.from({ length: 28 }, (_, index) => ({
  x: (index * 47 % 61 + .5) / 2,
  y: (index * 31 % 59 + .5) / 2,
  r: [.35, .58, .82, 1.08][index % 4],
  opacity: [.35, .65, .5, .85, .46][index % 5],
}));

export default function TaiwanCoverageMap() {
  const map = useRef<SVGSVGElement>(null);
  const id = useId();
  const [hovered, setHovered] = useState<string>();
  const [focused, setFocused] = useState<string>();
  const active = hovered ?? focused;
  const grainId = id + '-grain';
  const lightId = id + '-light';

  useEffect(() => {
    const graphic = map.current;
    if (!graphic || !('IntersectionObserver' in window)) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      graphic.dataset.entered = '';
      observer.disconnect();
    }, { threshold: .32 });
    observer.observe(graphic);
    graphic.dataset.observe = '';
    return () => observer.disconnect();
  }, []);

  return <svg ref={map} className="coverage-graphic" viewBox="8 18 534 530" role="group" aria-labelledby={id + '-title'}>
    <title id={id + '-title'}>臺灣 22 縣市分布</title>
    <defs>
      {annotations.map(({ city }, index) => <path key={city} id={id + '-county-' + index} d={countyPaths[city]} fillRule="evenodd" />)}
      <pattern id={grainId} width="30.5" height="29.5" patternUnits="userSpaceOnUse">
        {grain.map(({ x, y, r, opacity }, index) =>
          <circle className={index % 4 === 0 ? 'coverage-spark' : undefined} key={index} cx={x} cy={y} r={r} opacity={opacity} />)}
      </pattern>
      <linearGradient id={lightId} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="white" stopOpacity="0" />
        <stop offset=".55" stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <mask id={id + '-sweep'} maskUnits="userSpaceOnUse" x="8" y="18" width="534" height="530">
        <rect className="coverage-light" x="8" y="18" width="534" height="120" fill={`url(#${lightId})`} />
      </mask>
    </defs>
    <g className="coverage-drift" aria-hidden="true">
      {Array.from({ length: 48 }, (_, index) =>
        <circle key={index} cx={22 + index * 73 % 504} cy={34 + index * 99 % 468}
          r={index % 4 === 0 ? 1.25 : .68} opacity={.14 + index % 5 * .07} />)}
    </g>
    <g aria-hidden="true">
      {annotations.map(({ city }, index) => <use key={city} className="coverage-tile"
        href={`#${id}-county-${index}`} data-tone={index % 4}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(city); }}
        onPointerLeave={() => setHovered(undefined)} />)}
      <g className="coverage-grain" fill={`url(#${grainId})`}>
        {annotations.map(({ city }, index) => <use key={city} href={`#${id}-county-${index}`} />)}
      </g>
      <g mask={`url(#${id}-sweep)`}>
        <g className="coverage-glint" fill={`url(#${grainId})`}>
          {annotations.map(({ city }, index) => <use key={city} href={`#${id}-county-${index}`} />)}
        </g>
      </g>
      {annotations.map(({ city, rail }, index) => <g key={city} className="coverage-raised"
        data-active={active === city || undefined} data-rail={rail}>
        <use className="coverage-raised-face" href={`#${id}-county-${index}`} />
        <use className="coverage-raised-grain" href={`#${id}-county-${index}`} fill={`url(#${grainId})`} />
      </g>)}
    </g>
    {annotations.map(({ city, longitude, latitude, rail, row }, index) => {
      const x = 340 + (longitude - 120.85) * 102;
      const y = 24 + (26.45 - latitude) * 112;
      const east = rail === 'east';
      const end = east ? 467 : rail === 'west' ? 179 : city === '金門縣' ? 79 : 174;
      const elbow = east ? 452 : rail === 'west' ? 195 : end + 14;
      const delay = { '--callout-delay': `${160 + index * 95}ms` } as CSSProperties;

      return <g className="coverage-callout" key={city} style={delay} data-active={active === city || undefined}
        aria-label={city} tabIndex={0}
        onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) setFocused(city); }}
        onBlur={() => setFocused(undefined)}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(city); }}
        onPointerLeave={() => setHovered(undefined)}>
        <path className="coverage-leader" d={`M${x},${y} L${elbow},${row} H${end}`} pathLength="1" />
        <circle className="coverage-ripple" cx={x} cy={y} r="6" />
        <circle className="coverage-pin" cx={x} cy={y} r="2.5" />
        <rect className="coverage-label-target" x={east ? end + 4 : end - 70} y={row - 12} width="66" height="24" />
        <text className="coverage-label" x={end + (east ? 8 : -8)} y={row} textAnchor={east ? 'start' : 'end'} dy=".34em">{city}</text>
      </g>;
    })}
  </svg>;
}
