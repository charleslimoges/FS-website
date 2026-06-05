"use client";

import { useEffect, useRef, useState } from "react";

interface ScrollRevealImageProps {
  src: string;
  alt: string;
  direction: "left" | "right" | "up";
  containerStyle: React.CSSProperties;
  imgStyle?: React.CSSProperties;
  imgClassName?: string;
}

export default function ScrollRevealImage({
  src,
  alt,
  direction,
  containerStyle,
  imgStyle,
  imgClassName,
}: ScrollRevealImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => setHasRevealed(true), 2200);
    return () => clearTimeout(timer);
  }, [visible]);

  const initialTransform =
    direction === "left"
      ? "translateX(-90px)"
      : direction === "right"
      ? "translateX(90px)"
      : "translateY(70px)";

  const hoverTransform =
    direction === "left"
      ? "translateX(-10px)"
      : direction === "right"
      ? "translateX(10px)"
      : "translateY(-10px)";

  const transform = !visible
    ? initialTransform
    : hasRevealed && isHovered
    ? hoverTransform
    : "translate(0, 0)";

  const transition = !visible
    ? "none"
    : hasRevealed
    ? "opacity 0.4s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), filter 0.4s ease"
    : "opacity 2s cubic-bezier(0.22, 1, 0.36, 1), transform 2s cubic-bezier(0.22, 1, 0.36, 1), filter 2.2s ease-out";

  return (
    <div
      ref={ref}
      className={direction !== "up" ? "hidden lg:block" : undefined}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        ...containerStyle,
        opacity: visible ? 1 : 0,
        transform,
        filter: visible ? "brightness(1)" : "brightness(0.2)",
        transition,
        willChange: "opacity, transform, filter",
        cursor: "default",
      }}
    >
      <img
        src={src}
        alt={alt}
        className={imgClassName ?? "w-full h-full object-cover"}
        style={imgStyle}
      />
    </div>
  );
}
