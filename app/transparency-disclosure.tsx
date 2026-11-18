'use client';

import { useEffect, useState, type ReactNode } from 'react';

export default function TransparencyDisclosure({ expanded, children }: { expanded: boolean; children: ReactNode }) {
  const [previousContent, setPreviousContent] = useState(children);

  useEffect(() => {
    if (expanded) setPreviousContent(children);
    else if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPreviousContent(null);
  }, [children, expanded]);

  return <div className="transparency-reveal" data-expanded={expanded} inert={!expanded}
    onTransitionEnd={(event) => {
      if (!expanded && event.target === event.currentTarget && event.propertyName === 'grid-template-rows') {
        setPreviousContent(null);
      }
    }}>
    <div>{expanded ? children : previousContent}</div>
  </div>;
}
