import { z } from "zod";

export const roleSchema = z.enum(["chairperson", "secretary", "treasurer", "admin", "waste_manager"]);
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
  postalCode: z.string().trim().regex(/^\d{5}$/, "Kode pos harus 5 digit"),
  village: z.string().trim().min(2).max(120),
  subdistrict: z.string().trim().min(2).max(120),
  regency: z.string().trim().min(2).max(120),
  province: z.string().trim().min(2).max(120),
});

export const residentSchema = z.object({
  householdId: z.string().uuid(),
  nik: identityNumber,
  fullName: z.string().trim().min(2).max(120),
  gender: z.enum(["male", "female"]),
  birthPlace: z.string().trim().min(2).max(120),
  birthDate: z.string().date().refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    const year = date.getUTCFullYear();
    return !Number.isNaN(date.getTime()) && year >= 1900 && date <= new Date();
  }, "Tanggal lahir harus valid, tidak kurang dari tahun 1900, dan tidak boleh melebihi hari ini"),
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

export const deathFundSchema = z.object({
  entryType: z.enum(["contribution","benefit"]),
  residentId: z.string().uuid().optional().or(z.literal("")),
  contributionMonth: z.string().regex(/^\d{4}-\d{2}$/,"Bulan iuran belum valid").optional().or(z.literal("")),
  deceasedName: z.string().trim().max(160).optional().or(z.literal("")),
  recipientName: z.string().trim().max(160).optional().or(z.literal("")),
  description: z.string().trim().max(300).optional().or(z.literal("")),
  amount: z.coerce.number().positive().max(1_000_000_000),
  transactionDate: z.string().date(),
}).superRefine((data,context)=>{
  if(data.entryType==="contribution"){
    if(!data.residentId)context.addIssue({code:"custom",path:["residentId"],message:"Pilih warga yang membayar iuran"});
    if(!data.contributionMonth)context.addIssue({code:"custom",path:["contributionMonth"],message:"Pilih bulan iuran"});
  }
  if(data.entryType==="benefit"){
    if(!data.deceasedName)context.addIssue({code:"custom",path:["deceasedName"],message:"Nama warga yang meninggal wajib diisi"});
    if(!data.recipientName)context.addIssue({code:"custom",path:["recipientName"],message:"Nama keluarga penerima wajib diisi"});
  }
});

export const bottleEventSchema = z.object({
  deviceCode: z.string().trim().min(2).max(80),
  bottleCount: z.coerce.number().int().positive().max(1000),
  weightKg: z.coerce.number().positive().max(1000),
});

const letterRequestBase=z.object({
  letterType: z.enum(["introduction","domicile","business","indigent","police_record","marriage","crowd_permit","birth","death","loss","unmarried"]),
  purpose: z.string().trim().min(3).max(300),
  businessName: z.string().trim().max(160).optional().or(z.literal("")),
  businessAddress: z.string().trim().max(300).optional().or(z.literal("")),
  partnerName: z.string().trim().max(160).optional().or(z.literal("")),
  destinationOffice: z.string().trim().max(160).optional().or(z.literal("")),
  eventName: z.string().trim().max(200).optional().or(z.literal("")),
  eventDate: z.string().date().optional().or(z.literal("")),
  eventTime: z.string().trim().max(80).optional().or(z.literal("")),
  eventPlace: z.string().trim().max(300).optional().or(z.literal("")),
  deathDate: z.string().date().optional().or(z.literal("")),
  deathPlace: z.string().trim().max(200).optional().or(z.literal("")),
  causeOfDeath: z.string().trim().max(200).optional().or(z.literal("")),
  lostItem: z.string().trim().max(300).optional().or(z.literal("")),
  incidentDate: z.string().date().optional().or(z.literal("")),
  incidentPlace: z.string().trim().max(300).optional().or(z.literal("")),
});
const validateLetterDetails=(data:z.infer<typeof letterRequestBase>,context:z.RefinementCtx)=>{
  if(data.letterType==="business"&&!data.businessName){
    context.addIssue({code:"custom",path:["businessName"],message:"Nama usaha wajib diisi untuk Surat Keterangan Usaha"});
  }
  if(data.letterType==="business"&&!data.businessAddress){
    context.addIssue({code:"custom",path:["businessAddress"],message:"Alamat usaha wajib diisi untuk Surat Keterangan Usaha"});
  }
  if(data.letterType==="crowd_permit"){
    if(!data.eventName)context.addIssue({code:"custom",path:["eventName"],message:"Nama kegiatan wajib diisi"});
    if(!data.eventDate)context.addIssue({code:"custom",path:["eventDate"],message:"Tanggal kegiatan wajib diisi"});
    if(!data.eventPlace)context.addIssue({code:"custom",path:["eventPlace"],message:"Tempat kegiatan wajib diisi"});
  }
  if(data.letterType==="death"){
    if(!data.deathDate)context.addIssue({code:"custom",path:["deathDate"],message:"Tanggal meninggal wajib diisi"});
    if(!data.deathPlace)context.addIssue({code:"custom",path:["deathPlace"],message:"Tempat meninggal wajib diisi"});
  }
  if(data.letterType==="loss"){
    if(!data.lostItem)context.addIssue({code:"custom",path:["lostItem"],message:"Barang atau dokumen yang hilang wajib diisi"});
    if(!data.incidentDate)context.addIssue({code:"custom",path:["incidentDate"],message:"Tanggal kehilangan wajib diisi"});
    if(!data.incidentPlace)context.addIssue({code:"custom",path:["incidentPlace"],message:"Perkiraan tempat kehilangan wajib diisi"});
  }
};
export const letterRequestSchema=letterRequestBase.superRefine(validateLetterDetails);

export const staffLetterRequestSchema=letterRequestBase.extend({
  residentId:z.string().uuid(),
  letterNumber:z.string().trim().max(100).optional().or(z.literal("")),
  notes:z.string().trim().max(300).optional().or(z.literal("")),
}).superRefine((data,context)=>{
  validateLetterDetails(data,context);
  if(data.letterType!=="introduction")context.addIssue({code:"custom",path:["letterType"],message:"Layanan RT ini hanya menerbitkan Surat Pengantar untuk administrasi desa"});
});

export const letterReviewSchema = z.object({
  action: z.enum(["approve","reject"]),
  letterNumber: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(300).optional().or(z.literal("")),
});

export const rtOfficialSchema=z.object({
  position:z.enum(["chairperson","secretary","treasurer","admin","waste_manager"]),
  fullName:z.string().trim().min(2,"Nama pengurus minimal 2 karakter").max(120),
  startDate:z.string().date(),
  endDate:z.string().date().optional().or(z.literal("")),
  phone:z.string().trim().max(30).optional().or(z.literal("")),
  notes:z.string().trim().max(300).optional().or(z.literal("")),
}).refine((data)=>!data.endDate||data.endDate>=data.startDate,{
  path:["endDate"],message:"Tanggal selesai tidak boleh lebih awal dari tanggal mulai",
});

