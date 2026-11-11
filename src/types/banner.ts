export interface HeroSlide {
  id: string;
  tag: string;
  tagClasses: string;
  headingLines: string[];
  paragraph: string;
  ctaLabel: string;
  ctaHref: string;
  ctaClasses: string;
  icon: "zap" | "shirt" | "bag" | "truck";
  bgClass: string;
  textClass: string;
  artClasses: {
    circle: string;
    icon: string;
    badge: string;
    badgeLines: string[];
    dot: string;
  };
}

