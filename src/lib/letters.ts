export const letterLabels={
  introduction:"Surat Pengantar Umum",
  domicile:"Keterangan Domisili",
  business:"Keterangan Usaha",
  indigent:"Keterangan Tidak Mampu",
  police_record:"Pengantar SKCK",
  marriage:"Pengantar Nikah",
  crowd_permit:"Pengantar Izin Keramaian",
  birth:"Keterangan Kelahiran",
  death:"Keterangan Kematian",
  loss:"Pengantar Kehilangan",
  unmarried:"Keterangan Belum Menikah",
} as const;

export type LetterType=keyof typeof letterLabels;

export const letterDescriptions:Record<LetterType,string>={
  introduction:"Pengantar untuk keperluan administrasi umum di luar kategori khusus.",
  domicile:"Menerangkan tempat tinggal warga di wilayah RT.",
  business:"Pengantar yang menerangkan nama dan lokasi usaha warga.",
  indigent:"Pengantar untuk mengurus bantuan atau layanan sosial di instansi terkait.",
  police_record:"Pengantar warga untuk mengurus SKCK di kepolisian.",
  marriage:"Pengantar awal untuk mengurus administrasi nikah di kelurahan atau KUA.",
  crowd_permit:"Pengantar kegiatan yang melibatkan keramaian dan memerlukan izin pihak berwenang.",
  birth:"Pengantar pencatatan kelahiran berdasarkan data keluarga dan dokumen pendukung.",
  death:"Pengantar pencatatan kematian warga berdasarkan keterangan dan dokumen pendukung.",
  loss:"Pengantar untuk melaporkan kehilangan kepada kepolisian atau instansi terkait.",
  unmarried:"Menerangkan status belum menikah berdasarkan data dan pernyataan warga.",
};

export const letterRequirements:Record<LetterType,string[]>={
  introduction:["KTP","KK","Dokumen sesuai keperluan"],
  domicile:["KTP","KK","Bukti domisili bila diperlukan"],
  business:["KTP","KK","Bukti atau foto usaha","Pernyataan usaha"],
  indigent:["KTP","KK","Pernyataan tidak mampu","Dokumen pendukung"],
  police_record:["KTP","KK","Keperluan pembuatan SKCK"],
  marriage:["KTP","KK","Akta kelahiran","Data calon pasangan"],
  crowd_permit:["KTP","KK","Rincian kegiatan","Persetujuan lingkungan bila diperlukan"],
  birth:["KTP orang tua","KK","Surat kelahiran dari fasilitas kesehatan"],
  death:["KTP","KK","Surat kematian dari fasilitas kesehatan bila ada"],
  loss:["KTP","KK","Data atau salinan barang/dokumen yang hilang"],
  unmarried:["KTP","KK","Pernyataan belum menikah"],
};

export const letterDocumentTitles:Record<LetterType,string>={
  introduction:"SURAT PENGANTAR",
  domicile:"SURAT KETERANGAN DOMISILI",
  business:"SURAT KETERANGAN USAHA",
  indigent:"SURAT KETERANGAN TIDAK MAMPU",
  police_record:"SURAT PENGANTAR SKCK",
  marriage:"SURAT PENGANTAR NIKAH",
  crowd_permit:"SURAT PENGANTAR IZIN KERAMAIAN",
  birth:"SURAT KETERANGAN KELAHIRAN",
  death:"SURAT KETERANGAN KEMATIAN",
  loss:"SURAT PENGANTAR KEHILANGAN",
  unmarried:"SURAT KETERANGAN BELUM MENIKAH",
};

export const letterTypeOptions=Object.entries(letterLabels) as Array<[LetterType,string]>;

export function isLetterType(value:string):value is LetterType{return value in letterLabels;}
