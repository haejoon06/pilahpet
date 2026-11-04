"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function MemberLoginForm({next="/warga"}:{next?:string}) {
  const router = useRouter(); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(""); const data = Object.fromEntries(new FormData(event.currentTarget));
    const response = await fetch("/api/auth/member-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const body = await response.json(); setBusy(false);
    if (!response.ok) return setMessage(body.error ?? "Tidak dapat masuk.");
    router.push(next.startsWith("/")?next:"/warga"); router.refresh();
  }
  return <form className="form" onSubmit={submit}><div className="field"><label htmlFor="memberCode">Kode warga</label><input id="memberCode" name="memberCode" placeholder="RT-..." required /></div><div className="field"><label htmlFor="pin">PIN 6 digit</label><input id="pin" name="pin" type="password" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} required /></div>{message && <p className="message error" role="alert">{message}</p>}<button className="button dark" disabled={busy}>{busy ? "Memeriksa…" : "Masuk portal warga"}</button></form>;
}
