import React from 'react';
import Link from 'next/link';
import { capitalize } from '@/landing/utils';

interface TagsProps {
  tags: string[];
}

export default function Tags({ tags }: TagsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag: string, index: number) => (
        <span
          key={index}
          className="px-2 py-1 bg-tertiary-bg text-text-primary rounded-full text-xs hover:opacity-90"
        >
          <Link href={`/landing/articles`}>#{capitalize(tag)}</Link>
        </span>
      ))}
    </div>
  );
}

