'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function SearchForm() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get('query') as string;
    router.push(`/articles/search?query=${encodeURIComponent(query)}`);
  };

  return (
    <form id="search-form" className="flex items-center" onSubmit={handleSubmit}>
      <label htmlFor="search-input" className="sr-only">Search</label>
      <div className="relative w-full">
        <input
          type="text"
          id="query"
          name="query"
          className="bg-primary-bg border border-accent-cta text-text-primary text-sm rounded-lg focus:ring-accent-cta focus:border-accent-cta block w-full p-2.5"
          placeholder="Search articles..."
          required
        />
      </div>
      <button
        type="submit"
        className="p-2.5 ms-2 text-sm font-medium text-white bg-accent-cta rounded-lg border border-accent-hover hover:bg-accent-hover focus:ring-4 focus:outline-none focus:ring-accent-cta"
      >
        <svg
          className="w-4 h-4"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 20 20"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
          />
        </svg>
        <span className="sr-only">Search</span>
      </button>
    </form>
  );
}

