'use client';

import Form from 'next/form';
import { useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from '../action-icons.ts';
import { LayoutLink } from './result-layout.tsx';

export default function Pagination({ page, total, previous, next }: {
  page: number;
  total: number;
  previous?: string;
  next?: string;
}) {
  const params = [...useSearchParams()].filter(([key]) => key !== 'page' && key !== 'sources');

  return <nav className="pager" aria-label="結果頁碼">
    {previous
      ? <LayoutLink href={previous} aria-label="上一頁" title="上一頁"><ChevronLeft size={20} aria-hidden="true" /></LayoutLink>
      : <button type="button" aria-label="上一頁" disabled><ChevronLeft size={20} aria-hidden="true" /></button>}
    <Form action="/search#results" className="page-jump">
      {params.map(([name, value], index) => <input key={index} type="hidden" name={name} value={value} />)}
      <input key={page} name="page" type="number" min={1} max={total} required defaultValue={page}
        aria-label="跳至頁碼" title="輸入頁碼後按 Enter" inputMode="numeric" enterKeyHint="go"
        style={{ inlineSize: Math.max(2, String(total).length + 1) + 'ch' }} />
      <span aria-label={'共 ' + total + ' 頁'}>/ {total}</span>
      <button type="submit" hidden>前往頁碼</button>
    </Form>
    {next
      ? <LayoutLink href={next} aria-label="下一頁" title="下一頁"><ChevronRight size={20} aria-hidden="true" /></LayoutLink>
      : <button type="button" aria-label="下一頁" disabled><ChevronRight size={20} aria-hidden="true" /></button>}
  </nav>;
}
