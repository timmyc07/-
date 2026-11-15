import type { ReactNode } from 'react';
import { BlurFade } from './site-motion.tsx';

export default function Template({ children }: { children: ReactNode }) {
  return <BlurFade>{children}</BlurFade>;
}
