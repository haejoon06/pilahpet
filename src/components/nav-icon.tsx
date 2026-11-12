export type NavIconName="home"|"people"|"wallet"|"recycle"|"mail"|"settings"|"ticket"|"profile"|"logout";

export default function NavIcon({name}:{name:NavIconName}){
  const common={fill:"none",stroke:"currentColor",strokeWidth:2,strokeLinecap:"round" as const,strokeLinejoin:"round" as const};
  return <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...common}>
    {name==="home"&&<><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/></>}
    {name==="people"&&<><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>}
    {name==="wallet"&&<><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6"/><path d="M16 13h4"/><circle cx="16" cy="15" r=".5" fill="currentColor" stroke="none"/></>}
    {name==="recycle"&&<><path d="m7.5 4 2-2 2 2"/><path d="M9.5 2 6 8h4"/><path d="m18.5 12 2.7.8-.7 2.7"/><path d="m21.2 12.8-3.5-6-2 3.5"/><path d="m9 20-.7-2.7-2.7.7"/><path d="m8.3 17.3h7l-2-3.5"/></>}
    {name==="mail"&&<><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>}
    {name==="settings"&&<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06a1.7 1.7 0 0 0-1.88-.34 1.7 1.7 0 0 0-1.03 1.56V21h-4v-.09A1.7 1.7 0 0 0 9 19.36a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.63 15 1.7 1.7 0 0 0 3.09 14H3v-4h.09A1.7 1.7 0 0 0 4.64 9a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.63 1.7 1.7 0 0 0 10 3.09V3h4v.09A1.7 1.7 0 0 0 15 4.64a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.37 9 1.7 1.7 0 0 0 20.91 10H21v4h-.09A1.7 1.7 0 0 0 19.4 15Z"/></>}
    {name==="ticket"&&<><path d="M3 8a2 2 0 0 0 0 4v5h18v-5a2 2 0 0 0 0-4V3H3Z"/><path d="M13 5v2M13 10v2M13 15v2"/></>}
    {name==="profile"&&<><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>}
    {name==="logout"&&<><path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/></>}
  </svg>;
}
