import type { NavbarData } from "@/types/navigation";

export const navbarData: NavbarData = {
  topStripMessage: "Free delivery on orders over ৳2,000",
  wishlistCount: 2,
  cartItems: [
    {
      id: "item-1",
      name: "Wireless Earbuds Pro",
      qty: 1,
      price: 2450,
    },
    {
      id: "item-2",
      name: "Cotton Panjabi",
      qty: 2,
      price: 1200,
    },
  ],
  categories: [
    {
      name: "Electronics",
      subcategories: [
        "Mobile phones",
        "Laptops",
        "Cameras",
        "Headphones",
        "Smart watches",
        "Accessories",
      ],
    },
    {
      name: "Fashion",
      subcategories: [
        "Men’s clothing",
        "Women’s clothing",
        "Shoes",
        "Bags",
        "Watches",
        "Jewelry",
      ],
    },
    {
      name: "Home & living",
      subcategories: [
        "Furniture",
        "Kitchen",
        "Decor",
        "Bedding",
        "Lighting",
        "Storage",
      ],
    },
    {
      name: "Beauty & health",
      subcategories: [
        "Skincare",
        "Makeup",
        "Hair care",
        "Fragrance",
        "Supplements",
        "Personal care",
      ],
    },
    {
      name: "Groceries",
      subcategories: [
        "Rice & grains",
        "Snacks",
        "Beverages",
        "Fresh produce",
        "Spices",
        "Cooking oil",
      ],
    },
    {
      name: "Mother & baby",
      subcategories: [
        "Diapers",
        "Baby food",
        "Toys",
        "Clothing",
        "Strollers",
        "Feeding",
      ],
    },
    {
      name: "Sports & outdoor",
      subcategories: [
        "Fitness",
        "Cricket",
        "Football",
        "Cycling",
        "Camping",
        "Sportswear",
      ],
    },
    {
      name: "Books & stationery",
      subcategories: [
        "Textbooks",
        "Novels",
        "Notebooks",
        "Art supplies",
        "Office supplies",
        "Gift cards",
      ],
    },
  ],
};

