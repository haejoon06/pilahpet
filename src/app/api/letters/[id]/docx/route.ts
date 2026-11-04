import { AlignmentType,BorderStyle,Document,Packer,Paragraph,Table,TableCell,TableRow,TextRun,WidthType } from "docx";
import { requestMemberSession,requestSession } from "@/lib/auth";
import { getLocation,getSql } from "@/lib/db";
import { decryptIdentityNumber } from "@/lib/pii";

const labels:Record<string,string>={introduction:"SURAT PENGANTAR",domicile:"SURAT KETERANGAN DOMISILI",business:"SURAT KETERANGAN USAHA",indigent:"SURAT KETERANGAN TIDAK MAMPU"};
const cell=(text:string,bold=false,width=33)=>new TableCell({width:{size:width,type:WidthType.PERCENTAGE},children:[new Paragraph({children:[new TextRun({text,bold,color:"000000"})]})],borders:{top:{style:BorderStyle.NONE},bottom:{style:BorderStyle.NONE},left:{style:BorderStyle.NONE},right:{style:BorderStyle.NONE}}});

export async function GET(request:Request,context:RouteContext<"/api/letters/[id]/docx">){
  const staff=await requestSession(request,["operator","supervisor","admin"]);const member=staff?null:await requestMemberSession(request);if(!staff&&!member)return new Response("Tidak berwenang",{status:401});
  const {id}=await context.params;const location=await getLocation();if(!location)return new Response("Lokasi belum tersedia",{status:503});const sql=getSql();
  const [row]=await sql`SELECT lr.*,m.name,m.area,m.resident_id,r.nik_encrypted,r.birth_place,r.birth_date,r.gender,r.occupation,r.religion,h.address,h.rt,h.rw,h.village,h.subdistrict,h.regency,h.province
    FROM letter_requests lr JOIN members m ON m.id=lr.member_id
    LEFT JOIN residents r ON r.id=m.resident_id LEFT JOIN households h ON h.id=r.household_id
    WHERE lr.id=${id} AND lr.location_id=${location.id} AND lr.status='approved'`;
  if(!row)return new Response("Surat belum disetujui atau tidak ditemukan",{status:404});if(member&&row.member_id!==member.memberId)return new Response("Tidak berwenang",{status:403});
  const nik=row.nik_encrypted?decryptIdentityNumber(String(row.nik_encrypted)):"-";const address=row.address?`${row.address}, RT ${row.rt}/RW ${row.rw}, ${row.village}, ${row.subdistrict}, ${row.regency}`:row.area;
  const extra=(row.extra_data??{}) as {businessName?:string|null;businessAddress?:string|null};
  const intro=row.letter_type==="domicile"?"Dengan ini menerangkan bahwa nama tersebut benar berdomisili di wilayah kami.":row.letter_type==="business"?`Dengan ini menerangkan bahwa nama tersebut memiliki usaha ${extra.businessName||"-"} yang beralamat di ${extra.businessAddress||address}.`:row.letter_type==="indigent"?"Dengan ini menerangkan bahwa nama tersebut merupakan warga kami dan berdasarkan keterangan yang ada termasuk keluarga yang memerlukan dukungan sosial.":`Dengan ini menerangkan bahwa nama tersebut adalah warga kami dan surat ini dibuat untuk keperluan ${row.purpose}.`;
  const identityRows=[["Nama",row.name],["NIK",nik],["Tempat/Tanggal Lahir",row.birth_place?`${row.birth_place}, ${new Date(row.birth_date).toLocaleDateString("id-ID")}`:"-"],["Jenis Kelamin",row.gender==="male"?"Laki-laki":row.gender==="female"?"Perempuan":"-"],["Pekerjaan",row.occupation||"-"],["Alamat",address]];
  const doc=new Document({sections:[{properties:{page:{margin:{top:850,right:850,bottom:850,left:850}}},children:[
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:"PENGURUS RUKUN TETANGGA",bold:true,size:30})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`RT ${location.rt_number||'-'} / RW ${location.rw_number||'-'} - ${(location.village||location.name).toUpperCase()}`,bold:true,size:26})]}),
    new Paragraph({alignment:AlignmentType.CENTER,border:{bottom:{style:BorderStyle.DOUBLE,size:6,color:"000000"}},children:[new TextRun({text:location.address||"Sekretariat RT",size:20})]}),
    new Paragraph({text:""}),new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:labels[row.letter_type]||"SURAT KETERANGAN",bold:true,size:30,color:"000000"})]}),
    new Paragraph({alignment:AlignmentType.CENTER,children:[new TextRun({text:`Nomor: ${row.letter_number||"-"}`,underline:{}})]}),
    new Paragraph({text:"Yang bertanda tangan di bawah ini, Ketua RT, menerangkan bahwa:"}),
    new Table({width:{size:100,type:WidthType.PERCENTAGE},rows:identityRows.map(([key,value])=>new TableRow({children:[cell(String(key),true,32),cell(":",false,4),cell(String(value??"-"),false,64)]}))}),
    new Paragraph({text:""}),new Paragraph({text:intro,alignment:AlignmentType.JUSTIFIED}),new Paragraph({text:`Surat ini dipergunakan untuk: ${row.purpose}.`,alignment:AlignmentType.JUSTIFIED}),
    new Paragraph({text:"Demikian surat ini dibuat dengan sebenarnya agar dapat dipergunakan sebagaimana mestinya.",alignment:AlignmentType.JUSTIFIED}),
    new Paragraph({text:""}),new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:`Karawang, ${new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}`})]}),
    new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:`Ketua RT ${location.rt_number||''}`.trim()})]}),new Paragraph({text:"\n\n",alignment:AlignmentType.RIGHT}),new Paragraph({alignment:AlignmentType.RIGHT,children:[new TextRun({text:`(${location.chairperson_name||'________________________'})`})]}),
  ]}]});
  const buffer=await Packer.toBuffer(doc);const safeName=String(row.name).replace(/[^a-zA-Z0-9]+/g,"-").replace(/^-|-$/g,"");
  return new Response(new Uint8Array(buffer),{headers:{"content-type":"application/vnd.openxmlformats-officedocument.wordprocessingml.document","content-disposition":`attachment; filename="${row.letter_type}-${safeName}.docx"`}});
}
