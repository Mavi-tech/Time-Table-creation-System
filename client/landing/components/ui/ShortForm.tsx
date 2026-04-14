'use client';

import React from 'react';

export default function ShortForm() {
  return (
    <form
      className="bg-transparent px-10 py-14 rounded-[14px] gap-5 h-full flex flex-col sm:flex-row items-center justify-center border border-text-primary/10"
    >
      <div className="w-full sm:w-[55%]">
        <input
          type="text"
          id="email"
          name="email"
          placeholder="Email"
          className="bg-transparent w-full px-[35px] py-5 border border-text-primary/20 rounded-[14px] text-text-primary placeholder:text-text-primary/50 focus:outline-none focus:border-accent-cta"
        />
      </div>
      <button type="submit" name="submit" className="w-full sm:w-[45%] btn-tertiary">
        Subscribe to news
      </button>
    </form>
  );
}

