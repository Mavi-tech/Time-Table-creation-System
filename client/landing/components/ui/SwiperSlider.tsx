'use client';

import React, { useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import clientData from '@/landing/data/clientData.json';

export default function SwiperSlider() {
  const processedTestimonials = clientData.map((item, index, array) => ({
    ...item,
    index: index + 1,
    length: array.length
  }));

  return (
    <>
      <div
        id="ProjectSlider"
        className="swiper mt-10"
        style={{
          '--swiper-pagination-color': 'var(--tertiary-bg)',
          '--swiper-pagination-bullet-inactive-color': '#fff',
          '--swiper-pagination-bullet-inactive-opacity': '1',
          '--swiper-pagination-bullet-size': '19px',
          '--swiper-pagination-bullet-horizontal-gap': '10px',
        } as React.CSSProperties}
      >
        <Swiper
          modules={[Pagination, Navigation]}
          pagination={{
            clickable: true,
          }}
          navigation={{
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          }}
          loop={true}
          slidesPerView={1}
          spaceBetween={50}
          breakpoints={{
            1024: {
              slidesPerView: 2,
            },
            320: {
              slidesPerView: 1,
            },
          }}
          className="swiper-wrapper mt-[84px] mb-[124px]"
        >
          {processedTestimonials.map((item) => (
            <SwiperSlide
              key={item.index}
              className="text-text-secondary flex flex-col"
              role="group"
              aria-label={`${item.index} / ${item.length}`}
            >
              <div className="flex flex-col justify-center items-center py-[48px] px-6 sm:px-[52px]">
                <p className="bubble">
                  &quot;{item.comment}&quot;
                </p>
              </div>
              <div className="w-full px-10 sm:px-20">
                <div className="text-tertiary-bg font-medium">{item.name}</div>
                <div>{item.role}</div>
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
        <div className="flex justify-around lg:justify-center mb-[68px] lg:gap-[189px]">
          <div className="swiper-button-prev w-7 h-7 sm:w-10 sm:h-10 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path
                fill="#ffffff"
                d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
              ></path>
            </svg>
          </div>
          <div className="swiper-pagination"></div>
          <div className="swiper-button-next w-7 h-7 sm:w-10 sm:h-10 rotate-180 cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path
                fill="#ffffff"
                d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"
              ></path>
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}

