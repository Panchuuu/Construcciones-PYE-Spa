import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Factory,
  Hammer,
  HardHat,
  Ruler,
  Truck,
} from "lucide-react";

import type { ServiceIcon } from "@/backend/data/services";

/** Traduce la clave de ícono de la capa de datos a un componente visual. */
export const serviceIcons: Record<ServiceIcon, LucideIcon> = {
  "obra-gruesa": HardHat,
  edificacion: Building2,
  remodelacion: Hammer,
  industrial: Factory,
  ingenieria: Ruler,
  "movimiento-tierra": Truck,
};
