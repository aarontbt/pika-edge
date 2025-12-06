export const PRODUCT_CATEGORIES = [
  { id: "electronics", label: "Electronics", icon: "Laptop", emoji: "💻" },
  { id: "sneakers", label: "Sneakers", icon: "Footprints", emoji: "👟" },
  { id: "fashion", label: "Fashion", icon: "Shirt", emoji: "👕" },
  { id: "collectibles", label: "Collectibles", icon: "Trophy", emoji: "🏆" },
  { id: "gaming", label: "Gaming", icon: "Gamepad2", emoji: "🎮" },
  { id: "watches", label: "Watches", icon: "Watch", emoji: "⌚" },
  { id: "bags", label: "Bags", icon: "ShoppingBag", emoji: "👜" },
  { id: "cosmetics", label: "Cosmetics", icon: "Sparkles", emoji: "✨" },
];

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["id"];
