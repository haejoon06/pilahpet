export const STAFF_ROLES = ["chairperson", "secretary", "treasurer", "admin", "waste_manager"] as const;

export type Role = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  chairperson: "Ketua RT",
  secretary: "Sekretaris",
  treasurer: "Bendahara",
  admin: "Admin",
  waste_manager: "Pengelola Sampah Botol",
};
