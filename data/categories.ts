import type { Category, CategoryId } from "@/types";

export const CATEGORIES: readonly Category[] = [
  { id: "all", label: "All", icon: "LayoutGrid", hint: "everything" },
  { id: "places", label: "Places & Services", icon: "MapPin", hint: "services" },
  { id: "food", label: "Food & Restaurants", icon: "Utensils", hint: "restaurants" },
  { id: "coffee", label: "Coffee & Tea", icon: "Coffee", hint: "coffee shops and milk tea" },
  { id: "stay", label: "Where to Stay", icon: "BedDouble", hint: "hotels and resorts" },
  { id: "attractions", label: "Tourist Spots", icon: "Camera", hint: "landmarks and museums" },
  { id: "health", label: "Health & Dental", icon: "Stethoscope", hint: "dentists and clinics" },
  { id: "shopping", label: "Shopping", icon: "ShoppingBag", hint: "groceries and pharmacies" },
  { id: "government", label: "Government", icon: "Landmark", hint: "offices and ordinances" },
  { id: "barangay", label: "Barangay Updates", icon: "Megaphone", hint: "announcements" },
  { id: "schools", label: "Schools", icon: "GraduationCap", hint: "school notices" },
  { id: "events", label: "Events", icon: "CalendarDays", hint: "community activities" },
  { id: "traffic", label: "Road & Traffic", icon: "Construction", hint: "road closures" },
];

export const CATEGORY_LABELS: Readonly<Record<CategoryId, string>> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>;
