import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Card from './Card';

interface TeamCardProps {
  pic: any;
  name: string;
  role: string;
  description: string;
  link: string;
}

export default function TeamCard({ pic, name, role, description, link }: TeamCardProps) {
  return (
    <Card isUnderline={true}>
      <div className="card-hover p-6 md:p-8 lg:p-10">
        <div className="flex flex-col sm:flex-row relative">
          <picture className="transition-transform duration-300 hover:scale-110">
            <Image src={typeof pic === 'string' ? pic : pic.src || pic} alt={name} width={80} height={80} className="rounded-full" />
          </picture>
          <div className="flex flex-col justify-end sm:ml-4">
            <h3 className="text-lg md:text-xl font-playfair font-bold text-text-primary">{name}</h3>
            <p className="text-sm font-medium text-text-primary/70 mt-1">{role}</p>
          </div>
          <Link href={link} className="absolute right-0 top-0 transition-transform duration-300 hover:scale-110 hover:-rotate-12">
            <Image src="/assets/pics/profile-in.svg" alt="Linkedin Logo" width={20} height={20} />
          </Link>
        </div>
        <div className="w-full h-[1px] bg-text-primary/10 my-4 md:my-5"></div>
        <div className="text-sm md:text-base leading-relaxed text-text-primary/80">{description}</div>
      </div>
    </Card>
  );
}

