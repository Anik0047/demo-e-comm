export interface FooterLink {
  label: string;
  href: string;
}

export interface NewsletterContent {
  label: string;
  placeholder: string;
  submitLabel: string;
  errorMessage: string;
  successMessage: string;
}

export interface FooterData {
  description: string;
  contacts: { icon: "phone" | "mail" | "mapPin" | "clock"; text: string }[];
  linkGroups: { title: string; links: FooterLink[] }[];
  socials: { icon: "facebook" | "instagram" | "youtube" | "linkedin"; href: string; label: string }[];
  newsletter: NewsletterContent;
  paymentLabel: string;
  paymentChips: string[];
  paymentCards: { icon: "visa" | "mastercard"; label: string }[];
  copyright: string;
  bottomLinks: FooterLink[];
  locale: string;
}
