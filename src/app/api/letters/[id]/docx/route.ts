import { AlignmentType,BorderStyle,Document,Packer,Paragraph,Table,TableCell,TableRow,TextRun,WidthType } from "docx";
import { requestMemberSession,requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";
import { isLetterType,letterDocumentTitles } from "@/lib/letters";
import { decryptIdentityNumber } from "@/lib/pii";

const noBorders={top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}};
const cell=(text:string,bold=false,width=33,alignment:(typeof AlignmentType)[keyof typeof AlignmentType]=AlignmentType.LEFT)=>new TableCell({
  width:{size:width,type:WidthType.PERCENTAGE},verticalAlign:"center",margins:{top:70,bottom:70,left:80,right:80},
  children:[new Paragraph({alignment,children:[new TextRun({text,bold,color:"000000"})]})],borders:noBorders,
});
const formatDate=(value:unknown,withTime=false)=>{
  if(!value)return "-";
  const date=new Date(String(value));
  if(Number.isNaN(date.getTime()))return "-";
  return new Intl.DateTimeFormat("id-ID",withTime?{dateStyle:"long",timeZone:"Asia/Jakarta"}:{day:"numeric",month:"long",year:"numeric",timeZone:"Asia/Jakarta"}).format(date);
};
const cleanPlace=(value:string)=>value.replace(/^(kabupaten|kota)\s+/i,"").trim();

export async function GET(request:Request,context:RouteContext<"/api/letters/[id]/docx">){
  const staff=await requestSession(request,["chairperson","secretary","admin"]);
  const member=staff?null:await requestMemberSession(request);
  if(!staff&&!member)return new Response("Tidak berwenang",{status:401});
  const {id}=await context.params;
  const location=await getLocation();
  if(!location)return new Response("Lokasi belum tersedia",{status:503});
  const sql=getSql();
  const [row]=await sql`SELECT lr.*,COALESCE(r.full_name,m.name) AS name,m.area,r.nik_encrypted,r.birth_place,r.birth_date,r.gender,r.occupation,r.religion,r.marital_status,
    h.address,h.rt,h.rw,h.postal_code,h.village,h.subdistrict,h.regency,h.province
    FROM letter_requests lr
    LEFT JOIN members m ON m.id=lr.member_id
    LEFT JOIN residents r ON r.id=COALESCE(lr.resident_id,m.resident_id)
    LEFT JOIN households h ON h.id=r.household_id
    WHERE lr.id=${id} AND lr.location_id=${location.id} AND lr.status='approved'`;
  if(!row)return new Response("Surat belum disetujui atau tidak ditemukan",{status:404});
  if(member){
    const [owner]=await sql`SELECT resident_id FROM members WHERE id=${member.memberId}`;
    if(row.member_id!==member.memberId&&(!owner?.resident_id||row.resident_id!==owner.resident_id))return new Response("Tidak berwenang",{status:403});
  }

  const nik=row.nik_encrypted?decryptIdentityNumber(String(row.nik_encrypted)):"-";
  const address=row.address?`${row.address}, RT ${row.rt}/RW ${row.rw}, ${row.village}, ${row.subdistrict}, ${row.regency}${row.postal_code?` ${row.postal_code}`:""}`:row.area||"-";
  const letterType=isLetterType(String(row.letter_type))?String(row.letter_type) as keyof typeof letterDocumentTitles:"introduction";
  const extra=(row.extra_data??{}) as Record<string,string|null|undefined>;
  const detailRows:Array<[string,string]>=[];
  let statement=`Dengan ini memberikan pengantar kepada nama tersebut untuk keperluan ${row.purpose}.`;
  let serviceNote="";
  if(letterType==="domicile")statement="Dengan ini menerangkan bahwa nama tersebut benar merupakan warga dan berdomisili di wilayah kami.";
  if(letterType==="business"){
    statement=`Berdasarkan keterangan yang disampaikan, nama tersebut menjalankan usaha bernama ${extra.businessName||"-"} yang beralamat di ${extra.businessAddress||address}.`;
    detailRows.push(["Nama usaha",extra.businessName||"-"],["Alamat usaha",extra.businessAddress||address]);
  }
  if(letterType==="indigent")statement="Dengan ini menerangkan bahwa nama tersebut merupakan warga kami dan berdasarkan data serta keterangan yang tersedia memerlukan pengantar untuk memperoleh layanan atau bantuan sosial.";
  if(letterType==="police_record"){
    statement="Dengan ini memberikan pengantar kepada nama tersebut untuk mengurus Surat Keterangan Catatan Kepolisian (SKCK) pada instansi kepolisian yang berwenang.";
    serviceNote="Surat ini hanya merupakan pengantar lingkungan. Pemeriksaan dan penerbitan SKCK sepenuhnya menjadi kewenangan Kepolisian Negara Republik Indonesia.";
  }
  if(letterType==="marriage"){
    statement=`Dengan ini memberikan pengantar kepada nama tersebut untuk mengurus administrasi pernikahan${extra.partnerName?` dengan calon pasangan bernama ${extra.partnerName}`:""}${extra.destinationOffice?` pada ${extra.destinationOffice}`:""}.`;
    if(extra.partnerName)detailRows.push(["Calon pasangan",extra.partnerName]);
    if(extra.destinationOffice)detailRows.push(["Kelurahan/KUA tujuan",extra.destinationOffice]);
  }
  if(letterType==="crowd_permit"){
    statement="Pada prinsipnya pengurus lingkungan tidak keberatan atas rencana kegiatan tersebut sepanjang telah memperoleh izin dari instansi berwenang, menjaga ketertiban, keamanan, kebersihan, dan tidak mengganggu warga sekitar.";
    detailRows.push(["Nama kegiatan",extra.eventName||"-"],["Tanggal",formatDate(extra.eventDate)],["Waktu",extra.eventTime||"-"],["Tempat",extra.eventPlace||"-"]);
    serviceNote="Surat ini bukan izin keramaian. Pemohon tetap wajib memenuhi ketentuan dan memperoleh izin dari pihak yang berwenang.";
  }
  if(letterType==="birth")statement="Berdasarkan keterangan keluarga dan dokumen pendukung yang diperlihatkan, nama tersebut merupakan warga kami dan surat ini dibuat sebagai pengantar pencatatan kelahiran pada instansi yang berwenang.";
  if(letterType==="death"){
    statement=`Berdasarkan keterangan keluarga dan dokumen pendukung yang diperlihatkan, nama tersebut telah meninggal dunia pada ${formatDate(extra.deathDate)} di ${extra.deathPlace||"-"}${extra.causeOfDeath?` dengan keterangan penyebab ${extra.causeOfDeath}`:""}.`;
    detailRows.push(["Tanggal meninggal",formatDate(extra.deathDate)],["Tempat meninggal",extra.deathPlace||"-"],["Penyebab",extra.causeOfDeath||"-"]);
  }
  if(letterType==="loss"){
    statement=`Berdasarkan keterangan yang disampaikan oleh yang bersangkutan, telah terjadi kehilangan ${extra.lostItem||"barang/dokumen"} pada ${formatDate(extra.incidentDate)} di ${extra.incidentPlace||"-"}.`;
    detailRows.push(["Barang/dokumen hilang",extra.lostItem||"-"],["Tanggal kehilangan",formatDate(extra.incidentDate)],["Perkiraan tempat",extra.incidentPlace||"-"]);
    serviceNote="Kebenaran laporan dan penerbitan surat kehilangan menjadi kewenangan Kepolisian Negara Republik Indonesia.";
  }
  if(letterType==="unmarried"){
    statement="Berdasarkan data kependudukan yang tersedia dan pernyataan yang bersangkutan, nama tersebut berstatus belum menikah sampai surat ini dibuat.";
    detailRows.push(["Status perkawinan",row.marital_status||"Belum kawin"]);
  }
  const identityRows=[
    ["Nama",row.name],["NIK",nik],["Tempat, tanggal lahir",row.birth_place?`${row.birth_place}, ${formatDate(row.birth_date)}`:"-"],
    ["Jenis kelamin",row.gender==="male"?"Laki-laki":row.gender==="female"?"Perempuan":"-"],["Agama",row.religion||"-"],["Pekerjaan",row.occupation||"-"],["Alamat",address],
    ...detailRows,
  ];
  const signaturePlace=cleanPlace(String(row.regency||location.village||location.name));
  const signatureDate=formatDate(row.reviewed_at||new Date());
  const bodyChildren:Paragraph[]=[
    new Paragraph({spacing:{before:180,after:160},children:[new TextRun({text:"Yang bertanda tangan di bawah ini, Ketua RT, menerangkan bahwa:"})]}),
  ];
  const closingChildren=[
    new Paragraph({spacing:{before:180,after:120},alignment:AlignmentType.JUSTIFIED,children:[new TextRun({text:statement})]}),
    ...(letterType==="introduction"?[]:[new Paragraph({spacing:{after:120},alignment:AlignmentType.JUSTIFIED,children:[new TextRun({text:`Surat ini dipergunakan untuk: ${row.purpose}.`})]})]),
    ...(serviceNote?[new Paragraph({spacing:{after:120},alignment:AlignmentType.JUSTIFIED,children:[new TextRun({text:serviceNote,italics:true,size:20})]})]:[]),
    new Paragraph({spacing:{after:220},alignment:AlignmentType.JUSTIFIED,children:[new TextRun({text:"Demikian surat ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya."})]}),
  ];
  const doc=new Document({
    styles:{default:{document:{run:{font:"Arial",size:22,color:"000000"},paragraph:{spacing:{line:276}}}}},
    sections:[{properties:{page:{margin:{top:850,right:850,bottom:850,left:850}}},children:[
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:40},children:[new TextRun({text:"PENGURUS RUKUN TETANGGA",bold:true,size:30,color:"000000"})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:30},children:[new TextRun({text:`RT ${location.rt_number||"-"} / RW ${location.rw_number||"-"} - ${(location.village||location.name).toUpperCase()}`,bold:true,size:26,color:"000000"})]}),
      new Paragraph({alignment:AlignmentType.CENTER,border:{bottom:{style:BorderStyle.DOUBLE,size:6,color:"000000"}},spacing:{after:220},children:[new TextRun({text:location.address||"Sekretariat RT",size:20,color:"000000"})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:40},children:[new TextRun({text:letterDocumentTitles[letterType],bold:true,size:28,color:"000000",underline:{}})]}),
      new Paragraph({alignment:AlignmentType.CENTER,spacing:{after:160},children:[new TextRun({text:`Nomor: ${row.letter_number||"-"}`,color:"000000"})]}),
      ...bodyChildren,
      new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:identityRows.map(([key,value])=>new TableRow({children:[cell(String(key),true,31),cell(":",false,4,AlignmentType.CENTER),cell(String(value??"-"),false,65)]}))}),
      ...closingChildren,
      new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:[new TableRow({children:[cell("",false,54),new TableCell({width:{size:46,type:WidthType.PERCENTAGE},margins:{top:80,bottom:60,left:80,right:80},borders:noBorders,children:[
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`${signaturePlace}, ${signatureDate}`})]}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`Ketua RT ${location.rt_number||""}`.trim()})]}),
        new Paragraph({text:"\n\n",alignment:AlignmentType.CENTER}),
        new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`(${location.chairperson_name||"________________________"})`,bold:true})]}),
      ]})]})]}),
    ]}],
  });
  const buffer=await Packer.toBuffer(doc);
  const safeName=String(row.name).replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"");
  return new Response(new Uint8Array(buffer),{headers:{"content-type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","content-disposition":`attachment; filename="${row.letter_type}-${safeName}.docx"`}});
}
