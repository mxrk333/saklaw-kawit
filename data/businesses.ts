import type { Business } from "@/types";
import { BARANGAY_LISTINGS } from "./barangays";

/** All business-like listings. Add new real sources here as they are ingested. */
export const BUSINESSES: readonly Business[] = [...BARANGAY_LISTINGS];
