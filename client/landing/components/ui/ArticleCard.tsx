import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatDate } from '@/landing/utils';
import ArticleIcon from '../Icons/ArticleIcon';
import VideoIcon from '../Icons/VideoIcon';
import Card from './Card';

interface Article {
  slug: string;
  data: {
    title: string;
    pubDate: Date | string;
    author: string;
    authImage: string;
    image: string;
    tags: string[];
    summary: string;
    type: 'Article' | 'Tutorial';
  };
}

interface ArticleCardProps {
  article: Article;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Card isUnderline={true}>
      <article className="p-6">
        <div className="flex justify-between items-center mb-5 text-text-primary opacity-70">
          <span className="bg-tertiary-bg text-text-primary text-xs font-medium inline-flex items-center px-2.5 py-0.5 rounded">
            {article.data.type === 'Article' ? <ArticleIcon /> : <VideoIcon />}
            {article.data.type}
          </span>
          <span className="text-sm">{formatDate(article.data.pubDate)}</span>
        </div>
        <h2 className="mb-2 text-2xl font-bold tracking-tight text-text-primary">{article.data.title}</h2>
        <p className="mb-5 font-light text-text-primary opacity-70" style={{ whiteSpace: 'pre-line' }}>{article.data.summary}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Image className="w-7 h-7 rounded-full" src={article.data.authImage} alt={article.data.author + " cover"} width={28} height={28} />
            <span className="font-medium">
              {article.data.author}
            </span>
          </div>
          <Link href={`/landing/articles/${article.slug}`} className="inline-flex items-center font-medium text-text-primary hover:text-accent-cta">
            Read more
            <svg className="ml-2 w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd"></path>
            </svg>
          </Link>
        </div>
      </article>
    </Card>
  );
}

