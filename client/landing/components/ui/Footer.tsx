import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ShortForm from './ShortForm';

const logos = [
  { name: "Facebook", src: "/assets/facebook.svg", link: "https://facebook.com" },
  { name: "Linkedin", src: "/assets/linkedin.svg", link: "https://linkedin.com" },
  { name: "Twitter", src: "/assets/twitter.svg", link: "https://twitter.com" },
];

const links = [
  { name: "About us", href: "/landing/about" },
  { name: "Services", href: "/landing/services" },
  { name: "Use Cases", href: "/landing#cases" },
];

export default function Footer() {
  return (
    <section className="sm:px-5">
      <div className="w-full max-w-[1240px] mx-auto">
        <div className="px-4 md:px-6 bg-primary-bg text-text-primary py-8 md:py-10 lg:px-8 sm:rounded-t-[30px] border-4 border-black">
          <div>
            <div className="flex flex-col lg:flex-row gap-5 md:gap-6 items-center justify-between">
              <picture className="transition-transform duration-300 hover:scale-105">
                <Link href="/landing">
                  <Image src="/mssu.png" alt="MSSU Logo" width={120} height={120} className="h-24 md:h-28 lg:h-32 w-auto" />
                </Link>
              </picture>
              <ul className="flex flex-col sm:flex-row gap-4 md:gap-6">
                {links.map((link, index) => (
                  <li key={index} className="text-center">
                    <Link className="underline hover:no-underline transition-all duration-200 hover:text-accent-cta font-medium" href={link.href}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="flex gap-5">
                {logos.map((logo, index) => (
                  <li key={index}>
                    <a href={logo.link} target="_blank" rel="noopener noreferrer" className="transition-transform duration-300 hover:scale-110 hover:-translate-y-1 opacity-70 hover:opacity-100">
                      <picture>
                        <Image src={logo.src} alt={logo.name} width={24} height={24} className="invert" />
                      </picture>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col lg:flex-row mt-8 md:mt-10 mb-6 md:mb-8">
              <div className="flex text-center lg:text-start flex-col w-full lg:w-[30%]">
                <h3 className="mb-4 text-center md:text-left text-xl md:text-2xl font-playfair font-bold text-accent-cta">Contact us</h3>
                <div className="flex flex-col justify-between gap-4 text-text-primary/70">
                  <span> Email: contact@mssu.ac.in </span>
                  <span> Phone: (+91) 86559 46646/47 </span>
                  <span className="lg:w-3/4">
                    Address: 1st Floor Elphinstone Technical High School, Metro Chowk, Mumbai - 400001
                  </span>
                </div>
              </div>
              <div className="flex-grow my-10 lg:my-0 lg:ml-12">
                <ShortForm />
              </div>
            </div>
          </div>

          <div className="h-[1px] bg-text-primary opacity-20 mb-5"></div>
          <div className="flex flex-col lg:flex-row h-20 justify-center mt-4 text-center md:justify-between md:mt-0 text-text-primary/70 text-sm">
            <span>
              © MSSU All rights reserved
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

