import { z } from "zod";

import { rutSchema } from "@/backend/schemas/admin.schema";
import { moneySchema } from "@/backend/schemas/personal.schema";

/** Contratos de datos del control de ingresos y gastos. */

export const MOVEMENT_TYPES = {
  ingreso: "Ingreso",
  gasto: "Gasto",
} as const;

export type MovementType = keyof typeof MOVEMENT_TYPES;

export const EXPENSE_CATEGORIES = [
  "Materiales",
  "Arriendo de maquinaria y equipos",
  "Subcontratos",
  "Herramientas",
  "Combustible y transporte",
  "Remuneraciones",
  "Mano de obra día hombre",
  "Finiquitos",
  "Imposiciones y leyes sociales",
  "Honorarios",
  "Impuestos",
  "Arriendo de oficina o bodega",
  "Servicios básicos",
  "Seguros",
  "Alimentación",
  "Gastos administrativos",
  "Otros gastos",
] as const;

export const INCOME_CATEGORIES = [
  "Estado de pago de obra",
  "Anticipo de cliente",
  "Pago de cliente",
  "Venta de materiales",
  "Devoluciones",
  "Otros ingresos",
] as const;

/** Categorías que solo se generan desde el módulo de personal. */
export const AUTOMATIC_CATEGORIES = {
  payslip: "Remuneraciones",
  dayPayment: "Mano de obra día hombre",
  settlement: "Finiquitos",
} as const;

export const DOC_TYPES = {
  factura: "Factura",
  boleta: "Boleta",
  boleta_honorarios: "Boleta de honorarios",
  guia: "Guía de despacho",
  comprobante: "Comprobante / recibo",
  liquidacion: "Liquidación de sueldo",
  finiquito: "Finiquito",
  otro: "Otro",
} as const;

export const PAYMENT_METHODS = {
  transferencia: "Transferencia",
  efectivo: "Efectivo",
  cheque: "Cheque",
  tarjeta: "Tarjeta",
} as const;

export const movementSchema = z
  .object({
    type: z.enum(["ingreso", "gasto"], { message: "Elige ingreso o gasto" }),
    date: z
      .string()
      .trim()
      .min(1, "Indica la fecha")
      .transform((value) => new Date(`${value}T12:00:00Z`))
      .refine((value) => !Number.isNaN(value.getTime()), { message: "Fecha no válida" }),
    amount: moneySchema.refine((v) => v > 0, { message: "Indica el monto" }),
    category: z.string().trim().min(1, "Elige la categoría").max(60),
    description: z.string().trim().min(3, "Describe el movimiento").max(200),
    workId: z.string().trim().max(40).optional().or(z.literal("")),
    docType: z.string().trim().max(30).optional().or(z.literal("")),
    docNumber: z.string().trim().max(30).optional().or(z.literal("")),
    counterparty: z.string().trim().max(120).optional().or(z.literal("")),
    counterpartyRut: rutSchema.optional(),
    paymentMethod: z.string().trim().max(20).optional().or(z.literal("")),
    notes: z.string().trim().max(2000).optional().or(z.literal("")),
  })
  .refine(
    (data) =>
      (data.type === "gasto"
        ? (EXPENSE_CATEGORIES as readonly string[])
        : (INCOME_CATEGORIES as readonly string[])
      ).includes(data.category),
    { path: ["category"], message: "Elige una categoría de la lista" },
  );

export type MovementInput = z.infer<typeof movementSchema>;
