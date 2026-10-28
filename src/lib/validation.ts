import { z } from "zod";

export const roleSchema = z.enum(["operator", "treasurer", "supervisor", "admin"]);
export const memberSchema = z.object({
  name: z.string().trim().min(2).max(120), area: z.string().trim().min(1).max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  accountType: z.enum(["individual", "group"]), benefitMode: z.enum(["individual_balance", "group_cash"]),
});
export const priceSchema = z.object({ pricePerKg: z.coerce.number().min(0).max(1_000_000) });
export const depositSchema = z.object({
  memberId: z.string().uuid(), grossKg: z.coerce.number().positive().max(500),
  tareKg: z.coerce.number().min(0).max(500), clientTransactionId: z.string().min(8).max(120),
}).refine((v) => v.grossKg > v.tareKg, { message: "Berat bruto harus lebih besar dari tara" });
export const saleSchema = z.object({
  buyerName: z.string().trim().min(2).max(120), weightKg: z.coerce.number().positive().max(10_000),
  pricePerKg: z.coerce.number().min(0).max(1_000_000), transportCost: z.coerce.number().min(0).max(100_000_000),
});

