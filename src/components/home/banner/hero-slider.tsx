"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Shirt,
  ShoppingBag,
  Truck,
  Zap,
} from "lucide-react";
import type { HeroSlide } from "@/types/banner";

interface HeroSliderProps {
  slides: HeroSlide[];
}

function SlideArtIcon({
  icon,
  className,
}: {
  icon: HeroSlide["icon"];
  className: string;
}) {
  switch (icon) {
    case "zap":
      return <Zap className={className} strokeWidth={1.6} />;
    case "shirt":
      return <Shirt className={className} strokeWidth={1.6} />;
    case "bag":
      return <ShoppingBag className={className} strokeWidth={1.6} />;
    case "truck":
      return <Truck className={className} strokeWidth={1.6} />;
  }
}

export function HeroSlider({ slides }: HeroSliderProps) {
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [manualPaused, setManualPaused] = useState(false);
  const [tick, setTick] = useState(0);
  const touchStartX = useRef(0);

  const paused = hovering || manualPaused;
  const currentSlide = slides[index];

  const go = (targetIndex: number) => {
    const n = slides.length;
    setIndex((targetIndex + n) % n);
    setTick((t) => t + 1);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      go(index + (dx < 0 ? 1 : -1));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") go(index - 1);
    if (e.key === "ArrowRight") go(index + 1);
  };

  return (
    <div
      id="hero"
      className={`relative overflow-hidden rounded-2xl h-[420px] ${
        currentSlide?.textClass ?? ""
      } ${paused ? "paused" : ""}`.trim()}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      tabIndex={0}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onKeyDown={handleKeyDown}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        id="track"
        className="flex h-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, slideIndex) => (
          <article
            key={slide.id}
            className={`min-w-full h-full ${slide.bgClass} ${slide.textClass}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${slideIndex + 1} of ${slides.length}`}
          >
            <div className="h-full flex items-center pt-6 pb-16 px-6 sm:px-12 lg:px-8 xl:px-12 gap-6">
              <div className="flex-1">
                <span className={slide.tagClasses}>{slide.tag}</span>
                <h2 className="font-head font-extrabold text-3xl sm:text-4xl xl:text-5xl leading-tight">
                  {slide.headingLines.map((line, i) =>
                    i === 0 ? line : [<br key={i} />, line]
                  )}
                </h2>
                <p className="mt-3 text-sm sm:text-base">{slide.paragraph}</p>
                <Link href={slide.ctaHref} className={slide.ctaClasses}>
                  {slide.ctaLabel}
                </Link>
              </div>
              <div className="hidden md:grid w-[36%] place-items-center">
                <div className={slide.artClasses.circle}>
                  <SlideArtIcon
                    icon={slide.icon}
                    className={slide.artClasses.icon}
                  />
                  <span className={slide.artClasses.badge}>
                    {slide.artClasses.badgeLines.map((line, i) =>
                      i === 0 ? line : [<br key={i} />, line]
                    )}
                  </span>
                  <span className={slide.artClasses.dot} />
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="absolute left-6 right-6 sm:left-12 sm:right-12 lg:left-8 lg:right-8 xl:left-12 xl:right-12 bottom-5 flex items-center gap-3">
        <div
          id="bars"
          className="flex gap-2 flex-1"
          onAnimationEnd={(e) => {
            if (e.animationName === "kk-fill") {
              go(index + 1);
            }
          }}
        >
          {slides.map((_, k) => {
            const isDone = k < index;
            const isOn = k === index;
            const barClass = `bar ${isDone ? "done" : ""} ${
              isOn ? "on" : ""
            }`.trim();
            return (
              <button
                key={k}
                type="button"
                className={barClass}
                aria-label={`Go to slide ${k + 1}`}
                onClick={() => go(k)}
              >
                <span key={isOn ? `active-${tick}` : `inactive-${k}`} />
              </button>
            );
          })}
        </div>
        <button
          id="pp"
          type="button"
          className="w-9 h-9 rounded-full bg-white text-ink grid place-items-center hover:bg-brand-tint"
          aria-label={paused ? "Play slideshow" : "Pause slideshow"}
          onClick={() => setManualPaused((p) => !p)}
        >
          {paused ? (
            <Play className="w-3.5 h-3.5" fill="currentColor" stroke="none" />
          ) : (
            <Pause className="w-3.5 h-3.5" fill="currentColor" stroke="none" />
          )}
        </button>
        <button
          id="prev"
          type="button"
          className="hidden sm:grid w-9 h-9 rounded-full bg-white text-ink place-items-center hover:bg-brand-tint"
          aria-label="Previous slide"
          onClick={() => go(index - 1)}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          id="next"
          type="button"
          className="hidden sm:grid w-9 h-9 rounded-full bg-white text-ink place-items-center hover:bg-brand-tint"
          aria-label="Next slide"
          onClick={() => go(index + 1)}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}

