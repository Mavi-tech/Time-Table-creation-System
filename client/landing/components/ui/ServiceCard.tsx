import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Card from './Card';

interface ServiceCardProps {
  index: number;
  titleTop: string;
  titleBottom: string;
  img: any;
  alt: string;
  link: string;
}

export default function ServiceCard({ index, titleTop, titleBottom, img, alt, link }: ServiceCardProps) {
  return (
    <Card isUnderline={true}>
      <div
        className={`card-hover h-[250px] w-full sm:h-full lg:gap-8 grid custom-grid lg:grid-cols-2 lg:grid-rows-1 p-6 sm:p-8 lg:p-10 rounded-[30px] ${
          index === 1 ? 'bg-primary-bg' : index === 2 ? 'bg-tertiary-bg' : 'bg-secondary-bg text-text-secondary'
        }`}
      >
        <h3 className="flex flex-col col-span-2 lg:col-span-1 gap-1.5">
          <span className={`w-[fit-content] text-xl md:text-2xl font-playfair font-bold ${index === 1 ? 'greenhead' : 'whitehead'}`}>
            {titleTop}
          </span>
          <span className={`w-[fit-content] text-xl md:text-2xl font-playfair font-bold ${index === 1 ? 'greenhead' : 'whitehead'}`}>
            {titleBottom}
          </span>
        </h3>
        <picture className="w-full h-full row-span-1 order-1 lg:order-none lg:row-span-2 flex justify-center items-center transition-transform duration-500 hover:scale-110">
          <Image
            src={typeof img === 'string' ? img : img.src || img}
            alt={alt}
            className="h-[100px] w-auto sm:h-auto sm:w-3/4 object-cover"
            width={200}
            height={200}
          />
        </picture>
        <div className="flex items-end">
          <Link href={link} className="group flex items-center gap-3.5 transition-all duration-300 hover:gap-5">
            <Image src={index === 1 || index === 2 ? "/assets/icon6.svg" : "/assets/icon7.svg"} alt={alt} width={24} height={24} className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            <span className="hidden sm:block font-semibold">Service Info</span>
          </Link>
        </div>
      </div>
    </Card>
  );
}

