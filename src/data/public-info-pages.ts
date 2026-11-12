import type { PublicInfoPage } from "@/types/public-info";

export const publicInfoPages: PublicInfoPage[] = [
  { slug: "help-center", title: "Help center", summary: "Find your way around the Kenakata storefront demo.", sections: [
    { heading: "Orders and accounts", body: "Use the customer demo account menu to review orders, addresses, preferences, and notifications saved in this browser." },
    { heading: "Demo support", body: "This frontend demo has no support desk or live service connection. Contact details shown in the footer are sample content." },
  ] },
  { slug: "track-order", title: "Track order", summary: "Review order updates saved by this storefront demo.", sections: [
    { heading: "Your order history", body: "Customer demo orders appear in your account order history. Tracking numbers and delivery updates are examples only; no courier is contacted." },
  ] },
  { slug: "returns-and-refunds", title: "Returns and refunds", summary: "Learn what return information means in this demo.", sections: [
    { heading: "Demo order states", body: "Order actions in this frontend only update local demo data. They do not request a pickup, issue a refund, or contact a seller." },
    { heading: "Before a real purchase", body: "Review the seller’s actual return terms before buying through a live marketplace." },
  ] },
  { slug: "shipping-info", title: "Shipping information", summary: "Shipping details are not calculated in this frontend demo.", sections: [
    { heading: "Demo checkout", body: "Checkout records a sample delivery choice and address snapshot. It does not assign a courier, delivery date, or shipping fee." },
  ] },
  { slug: "contact-us", title: "Contact us", summary: "The contact details in this demo are placeholders.", sections: [
    { heading: "No live contact channel", body: "Kenakata’s frontend demo does not send messages or provide live customer support. The sample email, phone number, and location in the footer are not monitored." },
  ] },
  { slug: "become-a-vendor", title: "Become a vendor", summary: "Explore the seller experience shown in the Kenakata demo.", sections: [
    { heading: "Seller demo", body: "Vendor registration and marketplace onboarding are not connected in this frontend phase. No seller account is created from this page." },
  ] },
  { slug: "seller-guide", title: "Seller guide", summary: "A short guide to the seller areas represented in the demo.", sections: [
    { heading: "Catalog and orders", body: "Product approval, inventory, fulfillment, and earnings are sample interface concepts. This site does not save vendor changes or process orders for sellers." },
  ] },
  { slug: "seller-policies", title: "Seller policies", summary: "Seller policy content is informational demo copy.", sections: [
    { heading: "Before onboarding", body: "No binding seller agreement is provided here. A live marketplace would publish its current seller agreement and operating policies before onboarding." },
  ] },
  { slug: "about-us", title: "About Kenakata", summary: "Kenakata is a frontend concept for a Bangladesh marketplace.", sections: [
    { heading: "A marketplace demo", body: "The storefront demonstrates how independent sellers could present products to shoppers across Bangladesh. Catalog and account data are static or stored locally for demonstration." },
  ] },
  { slug: "careers", title: "Careers", summary: "There are no open positions in this frontend demo.", sections: [
    { heading: "Stay tuned", body: "This page is sample company information. It does not accept applications or collect personal information." },
  ] },
  { slug: "blog", title: "Kenakata journal", summary: "The journal is a placeholder in this storefront demo.", sections: [
    { heading: "Stories coming later", body: "No articles are published in this demo. Browse the product catalog to explore the current sample content." },
  ] },
  { slug: "privacy-policy", title: "Privacy policy", summary: "This frontend demo stores limited sample account activity in your browser.", sections: [
    { heading: "Local demo data", body: "Cart, wishlist, customer profile, address, order, review, and recently viewed demo records may be stored in browser local storage. Comparison selections use session storage." },
    { heading: "No connected services", body: "The demo does not send this information to a backend, analytics service, email provider, or payment processor. Clear browser storage to remove locally saved demo state." },
  ] },
  { slug: "terms-of-service", title: "Terms of service", summary: "These terms describe this frontend demo only and are not a marketplace agreement.", sections: [
    { heading: "Demonstration use", body: "Products, prices, sellers, checkout, and order records are illustrative. No purchase, payment, shipment, or legally binding transaction takes place." },
    { heading: "Availability", body: "Demo behavior and sample content may change as the storefront is developed." },
  ] },
  { slug: "cookies", title: "Storage and cookies", summary: "This demo uses browser storage for local demonstration state.", sections: [
    { heading: "Local storage", body: "Customer demo state is saved in local storage so it can persist between page visits. You can clear it in your browser settings or use the customer demo reset in account preferences." },
    { heading: "Session storage", body: "Product comparison selections are kept for the current browser session and are not part of customer account records." },
  ] },
  { slug: "gift-cards", title: "Gift cards", summary: "Gift cards are not available in this frontend demo.", sections: [
    { heading: "No gift card sales", body: "This demo does not sell, issue, redeem, or store gift cards. The page is included to explain the destination in the sample storefront navigation." },
  ] },
];
