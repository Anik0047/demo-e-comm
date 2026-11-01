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
    { title: "Shop", links: ["Flash deals", "New arrivals", "Best sellers", "Top vendors", "Gift cards"].map((label) => ({ label, href: "#" })) },
    { title: "Customer care", links: ["Help center", "Track order", "Returns and refunds", "Shipping info", "Contact us"].map((label) => ({ label, href: "#" })) },
    { title: "Sell on Kenakata", links: ["Become a vendor", "Vendor login", "Seller guide", "Seller policies"].map((label) => ({ label, href: "#" })) },
    { title: "Company", links: ["About us", "Careers", "Blog", "Privacy policy", "Terms of service"].map((label) => ({ label, href: "#" })) },
  ],
  socials: [
    { icon: "facebook", href: "#", label: "Kenakata on Facebook" },
    { icon: "instagram", href: "#", label: "Kenakata on Instagram" },
    { icon: "youtube", href: "#", label: "Kenakata on YouTube" },
    { icon: "linkedin", href: "#", label: "Kenakata on LinkedIn" },
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
  bottomLinks: ["Privacy", "Terms", "Cookies"].map((label) => ({ label, href: "#" })),
  locale: "EN / বাং · ৳ BDT",
};
