'use client';

import React, { useEffect } from 'react';
import Image from 'next/image';

export default function Form() {
  useEffect(() => {
    const cb1 = document.getElementById('checkbox1') as HTMLInputElement;
    const cb2 = document.getElementById('checkbox2') as HTMLInputElement;
    const message = document.getElementById('message') as HTMLTextAreaElement;

    if (cb1 && cb2) {
      cb1.checked = true;

      cb2.addEventListener('change', function () {
        if (cb2.checked) {
          cb1.checked = false;
          if (message) {
            message.value = "We're interested in your services! Please contact us";
          }
        } else {
          if (message) {
            message.value = '';
          }
          cb1.checked = true;
        }
      });

      cb1.addEventListener('change', function () {
        if (cb1.checked) {
          cb2.checked = false;
          if (message) {
            message.value = '';
          }
        } else {
          cb2.checked = true;
          if (message) {
            message.value = "We're interested in your services! Please contact us";
          }
        }
      });
    }
  }, []);

  return (
    <>
      <div className="flex relative justify-start items-center p-[60px] bg-primary-bg rounded-[45px] overflow-hidden">
        <form className="bg-primary-bg sm:p-6 h-full w-full lg:max-w-lg">
          <div className="flex flex-col sm:flex-row gap-[35px] sm:items-center mb-10">
            <div className="flex items-center gap-[14px]">
              <input
                type="checkbox"
                id="checkbox1"
                name="checkbox1"
                className="form-checkbox text-text-primary"
              />
              <label htmlFor="checkbox1" className="text-text-primary">Say Hi</label>
            </div>
            <div className="flex items-center gap-[14px]">
              <input
                type="checkbox"
                id="checkbox2"
                name="checkbox2"
                className="form-checkbox text-text-primary"
              />
              <label htmlFor="checkbox2" className="flex items-center text-text-primary">
                Get a Quote
              </label>
            </div>
          </div>

          <div className="mb-4">
            <label htmlFor="name" className="block text-text-primary mb-2">Name*</label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Name"
              className="w-full px-[30px] py-[18px] border border-accent-cta rounded-[14px] text-text-primary outline-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-text-primary mb-2">Email*</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Email"
              className="w-full px-[30px] py-[18px] border border-accent-cta rounded-[14px] text-text-primary outline-none"
            />
          </div>

          <div className="mb-4">
            <label htmlFor="message" className="block text-text-primary mb-2">Message*</label>
            <textarea
              id="message"
              name="message"
              placeholder="Message"
              className="w-full px-[30px] py-[18px] border border-accent-cta rounded-[14px] text-text-primary outline-none"
            ></textarea>
          </div>

          <button type="submit" name="submit" className="btn-primary w-full">Send</button>
        </form>
        <picture className="absolute right-[-25%] top-[2%] bottom-[2%] hidden lg:block">
          <Image src="/assets/pics/contact-pic.png" alt="decor" width={500} height={500} />
        </picture>
      </div>
    </>
  );
}

