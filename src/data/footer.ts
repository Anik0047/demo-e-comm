import type { FooterData } from "@/types/footer";

export const footerData: FooterData = {
  description: "Kenakata is a multi-vendor marketplace that connects shoppers across Bangladesh with trusted local sellers.",
  contacts: [
    { icon: "phone", text: "+880 1XXX-XXXXXX" },
    { icon: "mail", text: "support@kenakata.com" },
    { icon: "mapPin", text: "Dhaka, Bangladesh" },
    { icon: "clock", text: "Sat to Thu, 9 am to 9 pm" },
  ],
  linkGroups: [
    { title: "Shop", links: [
      { label: "Flash deals", href: "/products?promotion=flash-deals" },
      { label: "New arrivals", href: "/products?sort=newest" },
      { label: "Best sellers", href: "/products?sort=best-selling" },
      { label: "Top vendors", href: "/products?sort=top-rated" },
      { label: "Gift cards", href: "/info/gift-cards" },
    ] },
    { title: "Customer care", links: [
      { label: "Help center", href: "/info/help-center" },
      { label: "Track order", href: "/info/track-order" },
      { label: "Returns and refunds", href: "/info/returns-and-refunds" },
      { label: "Shipping info", href: "/info/shipping-info" },
      { label: "Contact us", href: "/info/contact-us" },
    ] },
    { title: "Sell on Kenakata", links: [
      { label: "Become a vendor", href: "/info/become-a-vendor" },
      { label: "Vendor login", href: "/login" },
      { label: "Seller guide", href: "/info/seller-guide" },
      { label: "Seller policies", href: "/info/seller-policies" },
    ] },
    { title: "Company", links: [
      { label: "About us", href: "/info/about-us" },
      { label: "Careers", href: "/info/careers" },
      { label: "Blog", href: "/info/blog" },
      { label: "Privacy policy", href: "/info/privacy-policy" },
      { label: "Terms of service", href: "/info/terms-of-service" },
    ] },
  ],
  socials: [
    { icon: "facebook", href: "https://www.facebook.com/", label: "Facebook" },
    { icon: "instagram", href: "https://www.instagram.com/", label: "Instagram" },
    { icon: "youtube", href: "https://www.youtube.com/", label: "YouTube" },
    { icon: "linkedin", href: "https://www.linkedin.com/", label: "LinkedIn" },
  ],
  newsletter: {
    label: "Get deals and new arrivals in your inbox",
    placeholder: "Enter your email",
    submitLabel: "Subscribe",
    errorMessage: "Please enter a valid email address.",
    successMessage: "Thanks for subscribing!",
  },
  paymentLabel: "We accept",
  paymentChips: ["bKash", "Nagad", "Cash on delivery"],
  paymentCards: [{ icon: "visa", label: "Visa" }, { icon: "mastercard", label: "Mastercard" }],
  copyright: "© 2026 Kenakata. All rights reserved.",
  bottomLinks: [
    { label: "Privacy", href: "/info/privacy-policy" },
    { label: "Terms", href: "/info/terms-of-service" },
    { label: "Cookies", href: "/info/cookies" },
  ],
  locale: "EN / বাং · ৳ BDT",
};
