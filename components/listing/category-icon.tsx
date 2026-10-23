import {
  BedDouble,
  CalendarDays,
  Camera,
  Construction,
  GraduationCap,
  Landmark,
  LayoutGrid,
  MapPin,
  Megaphone,
  ShoppingBag,
  Stethoscope,
  Utensils,
  type LucideIcon,
} from "lucide-react";
import { CATEGORIES } from "@/data/categories";
import type { CategoryId } from "@/types";

const ICONS: Record<string, LucideIcon> = {
  BedDouble,
  Camera,
  LayoutGrid,
  MapPin,
  Utensils,
  Stethoscope,
  ShoppingBag,
  Landmark,
  Megaphone,
  GraduationCap,
  CalendarDays,
  Construction,
};

export function CategoryIcon({ category, className }: { category: CategoryId; className?: string }) {
  const name = CATEGORIES.find((c) => c.id === category)?.icon ?? "MapPin";
  const Icon = ICONS[name] ?? MapPin;
  return <Icon className={className} aria-hidden />;
}
