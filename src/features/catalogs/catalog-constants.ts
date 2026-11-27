import {
  Bean,
  Beef,
  CakeSlice,
  Carrot,
  Cherry,
  Coffee,
  CupSoda,
  Droplet,
  Egg,
  Fish,
  Pizza,
  Salad,
  Sandwich,
  Shapes,
  Soup,
  Utensils,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

/** Icons a category can use (global ones and the picker for custom ones). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  coffee: Coffee,
  salad: Salad,
  soup: Soup,
  wheat: Wheat,
  utensils: Utensils,
  bean: Bean,
  carrot: Carrot,
  beef: Beef,
  fish: Fish,
  egg: Egg,
  sandwich: Sandwich,
  pizza: Pizza,
  cherry: Cherry,
  'cake-slice': CakeSlice,
  droplet: Droplet,
  'cup-soda': CupSoda,
  shapes: Shapes,
};

/** Literal class names so Tailwind generates them (tokens in src/styles/index.css). */
export const CATEGORY_COLORS: Record<string, string> = {
  amber: 'bg-cat-amber text-cat-amber-fg',
  green: 'bg-cat-green text-cat-green-fg',
  orange: 'bg-cat-orange text-cat-orange-fg',
  yellow: 'bg-cat-yellow text-cat-yellow-fg',
  brown: 'bg-cat-brown text-cat-brown-fg',
  red: 'bg-cat-red text-cat-red-fg',
  blue: 'bg-cat-blue text-cat-blue-fg',
  purple: 'bg-cat-purple text-cat-purple-fg',
  pink: 'bg-cat-pink text-cat-pink-fg',
  teal: 'bg-cat-teal text-cat-teal-fg',
  gray: 'bg-cat-gray text-cat-gray-fg',
};

export const TAG_GROUPS = ['diet', 'practical', 'moment', 'custom'] as const;
export const UTENSIL_GROUPS = ['cookware', 'appliance', 'specialised', 'custom'] as const;
