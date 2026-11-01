export interface HeroSlide {
  id: string;
  tag: string;
  tagClasses: string;
  headingLines: string[];
  paragraph: string;
  hasCountdown?: boolean;
  ctaLabel: string;
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

export interface Vendor {
  id: string;
  initials: string;
  colorClasses: string;
}

