import { z } from "zod";

export const roleSchema = z.enum(["operator", "treasurer", "supervisor", "admin"]);
export const memberSchema = z.object({
  name: z.string().trim().min(2, "Nama lengkap minimal 2 karakter").max(120),
  groupName: z.string().trim().max(120).optional().or(z.literal("")),
  participantCategory: z.enum(["elementary", "junior_high", "senior_high", "adult"]),
  rt: z.string().trim().regex(/^\d{1,3}$/, "RT harus berupa 1–3 angka"),
  rw: z.string().trim().regex(/^\d{1,3}$/, "RW harus berupa 1–3 angka"),
  village: z.string().trim().min(2, "Nama desa/kelurahan minimal 2 karakter").max(120),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  accountType: z.enum(["individual", "group"]), benefitMode: z.enum(["individual_balance", "group_cash"]),
});
export const publicApplicationSchema = memberSchema.extend({
  phone: z.string().trim().min(8, "Nomor kontak minimal 8 karakter").max(30),
});
export const applicationReviewSchema = z.object({
  action: z.enum(["approve", "reject"]),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
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
export const cancelDepositSchema = z.object({ reason: z.string().trim().min(5).max(300) });
export const payoutSchema = z.object({
  memberId: z.string().uuid(), amount: z.coerce.number().positive().max(100_000_000),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});
export const maintenanceSchema = z.object({
  inspectionType: z.string().trim().min(2).max(120), finding: z.string().trim().max(500).optional().or(z.literal("")),
  actionTaken: z.string().trim().max(500).optional().or(z.literal("")), critical: z.coerce.boolean().default(false),
  inspectedBy: z.string().trim().min(2).max(120),
});
export const memberLoginSchema = z.object({ memberCode: z.string().trim().min(4).max(40), pin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit") });

const identityNumber = z.string().trim().transform((value) => value.replace(/\D/g, "")).pipe(z.string().length(16, "Nomor harus tepat 16 digit"));
const regionNumber = z.string().trim().regex(/^\d{1,3}$/, "Harus berupa 1–3 angka");

export const householdSchema = z.object({
  familyCardNumber: identityNumber,
  headName: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(300),
  rt: regionNumber,
  rw: regionNumber,
  postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos harus 5 digit").optional().or(z.literal("")),
  village: z.string().trim().min(2).max(120),
  subdistrict: z.string().trim().min(2).max(120),
  regency: z.string().trim().min(2).max(120),
  province: z.string().trim().min(2).max(120),
  issuedAt: z.string().date().optional().or(z.literal("")),
});

export const residentSchema = z.object({
  householdId: z.string().uuid(),
  nik: identityNumber,
  fullName: z.string().trim().min(2).max(120),
  gender: z.enum(["male", "female"]),
  birthPlace: z.string().trim().min(2).max(120),
  birthDate: z.string().date(),
  religion: z.string().trim().min(2).max(60),
  education: z.string().trim().min(1).max(120),
  occupation: z.string().trim().min(1).max(120),
  bloodType: z.enum(["A", "B", "AB", "O", "unknown"]),
  maritalStatus: z.string().trim().min(2).max(60),
  marriageDate: z.string().date().optional().or(z.literal("")),
  familyRelationship: z.string().trim().min(2).max(80),
  citizenship: z.string().trim().min(2).max(20),
  fatherName: z.string().trim().max(120).optional().or(z.literal("")),
  motherName: z.string().trim().max(120).optional().or(z.literal("")),
});

export const rtCashSchema = z.object({
  entryType: z.enum(["income","expense"]),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().min(3).max(300),
  amount: z.coerce.number().positive().max(1_000_000_000),
  transactionDate: z.string().date(),
});

export const bottleEventSchema = z.object({
  deviceCode: z.string().trim().min(2).max(80),
  bottleCount: z.coerce.number().int().positive().max(1000),
  weightKg: z.coerce.number().positive().max(1000),
});

export const letterRequestSchema = z.object({
  letterType: z.enum(["introduction","domicile","business","indigent"]),
  purpose: z.string().trim().min(3).max(300),
  businessName: z.string().trim().max(160).optional().or(z.literal("")),
  businessAddress: z.string().trim().max(300).optional().or(z.literal("")),
});

export const letterReviewSchema = z.object({
  action: z.enum(["approve","reject"]),
  letterNumber: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export const rtSettingsSchema=z.object({
  name:z.string().trim().min(2).max(120),
  rtNumber:regionNumber,
  rwNumber:regionNumber,
  village:z.string().trim().min(2).max(120),
  address:z.string().trim().min(3).max(300),
  chairpersonName:z.string().trim().min(2).max(120),
});

