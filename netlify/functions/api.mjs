import {getStore} from "@netlify/blobs";
import ExcelJS from "exceljs";
import {SIDES,DATE,MAX_SEATS,ONE_BOOKING_PER_GUEST,findGroup} from "./config.mjs";

export const config={path:"/api/*"};
const E=process.env;
const J=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json"}});
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tablesOf=r=>[...new Set(r.seats.map(s=>s.split("-")[0]))].join(", ");
const seatsOf=r=>r.seats.map(s=>"T"+s.replace("-"," S")).join(", ");
const pub=r=>({id:r.id,name:r.name,grouping:r.grouping,category:r.category,tables:tablesOf(r),seats:seatsOf(r),date:DATE,status:r.status});
const lag=t=>t?new Date(t).toLocaleString("en-NG",{timeZone:"Africa/Lagos"}):"";
const site=()=>E.URL||"https://artfullytee-tosinraphael.netlify.app";

async function email(to,subject,html){
  if(!E.BREVO_API_KEY||!E.SENDER_EMAIL){console.error("EMAIL SKIPPED: BREVO_API_KEY or SENDER_EMAIL is missing");return}
  if(!to){console.error("EMAIL SKIPPED: no recipient");return}
  const r=await fetch("https://api.brevo.com/v3/smtp/email",{method:"POST",
    headers:{"api-key":E.BREVO_API_KEY,"content-type":"application/json"},
    body:JSON.stringify({sender:{name:E.SENDER_NAME||"Tosin & Raphael’s Wedding",email:E.SENDER_EMAIL},to:[{email:to}],subject,htmlContent:html})});
  if(!r.ok)console.error("BREVO ERROR",r.status,await r.text());else console.log("EMAIL SENT to",to);
}
function ng(p){p=p.replace(/\D/g,"");return p.startsWith("234")?p:"234"+p.replace(/^0/,"")}
async function sms(to,text){
  if(!E.TERMII_API_KEY)return;
  await fetch("https://api.ng.termii.com/api/sms/send",{method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({to:ng(to),from:E.TERMII_SENDER,sms:text,type:"plain",channel:"generic",api_key:E.TERMII_API_KEY})});
}
const cardHtml=r=>{
  const F="font-family:Georgia,'Times New Roman',serif;";
  const lab=t=>`<div style="${F}font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#a07f3c;margin:0 0 3px">${t}</div>`;
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#f3ebe1">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3ebe1"><tr><td align="center" style="padding:30px 12px">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:100%;max-width:480px;background:#fffaf3;border:2px solid #c9a45c;border-radius:16px"><tr><td style="padding:7px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #dcc58f;border-radius:11px;${F}color:#3b1f27;text-align:center">
<tr><td style="padding:26px 22px 0;font-size:20px;letter-spacing:8px;color:#7a1f3d">&#10086; &#10022; &#10086;</td></tr>
<tr><td style="padding:12px 22px 0;${F}font-size:11px;letter-spacing:5px;text-transform:uppercase;color:#a07f3c">#ArtFullyTee</td></tr>
<tr><td style="padding:10px 18px 0;${F}font-size:38px;line-height:44px;color:#5b1a2a">Tosin <span style="font-style:italic;font-size:30px;color:#b08a3e">&amp;</span> Raphael</td></tr>
<tr><td style="padding:10px 22px 0;${F}font-size:12px;letter-spacing:6px;text-transform:uppercase;color:#3b1f27">Wedding Access Card</td></tr>
<tr><td style="padding:14px 22px 0;color:#c9a45c;font-size:15px;letter-spacing:6px">&mdash;&mdash;&mdash; &#9829; &mdash;&mdash;&mdash;</td></tr>
<tr><td style="padding:20px 22px 4px;${F}font-size:26px;color:#3b1f27">${esc(r.name)}</td></tr>
<tr><td style="padding:14px 22px 0">${lab("Grouping")}<div style="${F}font-size:16px;color:#3b1f27">${esc(r.grouping)}</div></td></tr>
<tr><td style="padding:14px 22px 0">${lab("Category")}<div style="${F}font-size:16px;color:#3b1f27">${esc(r.category)}</div></td></tr>
<tr><td style="padding:16px 14px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
<td width="40%" align="center">${lab("Table")}<div style="${F}font-size:26px;color:#5b1a2a">${tablesOf(r)}</div></td>
<td width="60%" align="center" style="border-left:1px solid #e6d5aa">${lab("Date")}<div style="${F}font-size:16px;line-height:26px;color:#3b1f27">${DATE}</div></td>
</tr></table></td></tr>
<tr><td align="center" style="padding:24px 22px 0"><table role="presentation" cellpadding="0" cellspacing="0" style="border:1px solid #dcc58f;border-radius:10px;background:#ffffff"><tr><td style="padding:12px">
<img alt="Your QR code" width="170" height="170" style="display:block" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=0&data=${encodeURIComponent(r.id+"|"+r.name)}"></td></tr></table></td></tr>
<tr><td style="padding:12px 22px 0;${F}font-size:15px;letter-spacing:4px;font-weight:bold;color:#5b1a2a">${r.id}</td></tr>
<tr><td style="padding:18px 22px 0;color:#c9a45c;font-size:15px;letter-spacing:6px">&mdash;&mdash;&mdash; &#9829; &mdash;&mdash;&mdash;</td></tr>
<tr><td style="padding:12px 26px 0;${F}font-size:13px;color:#6b565c">Please show this card at the entrance.</td></tr>
<tr><td style="padding:6px 26px 0;${F}font-size:15px;font-style:italic;color:#b08a3e">Thank you for being part of our special day.</td></tr>
<tr><td style="padding:12px 22px 4px;${F}font-size:12px"><a href="${site()}/rsvp.html?card=${r.id}" style="color:#7a1f3d">View card online</a></td></tr>
<tr><td style="padding:6px 22px 24px;font-size:18px;letter-spacing:8px;color:#7a1f3d">&#10086; &#10022; &#10086;</td></tr>
</table></td></tr></table></td></tr></table></body></html>`;
};

async function notifyBooked(r){
  const task=[
    email(r.email,"Your Access Card · Tosin & Raphael’s Wedding, 5 December 2026",cardHtml(r)),
    sms(r.phone,`Hi ${r.name.split(" ")[0]}, your seat is confirmed for Tosin & Raphael's wedding, ${DATE}. ${r.category}, Table ${tablesOf(r)}. Ref ${r.id}. Card: ${site()}/rsvp.html?card=${r.id}`),
    email(E.ADMIN_EMAIL,`New booking: ${r.name} (${r.category})`,`<p>${esc(r.name)} booked ${seatsOf(r)}.<br>${esc(r.email)} · ${esc(r.phone)}<br>Ref ${r.id}</p>`)];
  await Promise.allSettled(task);
}
async function notifyReleased(r){
  const link=site()+"/rsvp.html";
  await Promise.allSettled([
    email(r.email,"Please rebook your seat - Tosin & Raphael",`<p>Hi ${esc(r.name)},</p><p>There was a mistake with your seat selection (${seatsOf(r)}), so it has been released and your earlier access card (${r.id}) is no longer valid.</p><p>Please <a href="${link}">rebook your seat here</a>. Sorry for the inconvenience!</p>`),
    sms(r.phone,`Hi ${r.name.split(" ")[0]}, your earlier seat (${seatsOf(r)}) was released due to a mistake. Please rebook at ${link} . Ref ${r.id} is no longer valid.`),
    email(E.ADMIN_EMAIL,`Seat released: ${r.name}`,`<p>${esc(r.name)}'s seats ${seatsOf(r)} (Ref ${r.id}) were released and the guest was notified to rebook.</p>`)]);
}

export default async (req)=>{
  const u=new URL(req.url),p=u.pathname.replace(/^\/api\//,"");
  const seatS=getStore("seats"),bk=getStore("bookings");
  try{
    if(p==="config")return J({SIDES,DATE,MAX_SEATS});
    if(p==="taken"){const {blobs}=await seatS.list({prefix:"s:"});return J(blobs.map(b=>b.key.slice(2)))}
    if(p==="card"){const r=await bk.get("b:"+u.searchParams.get("id"),{type:"json"});return r?J(pub(r)):J({error:"Card not found"},404)}

    if(p==="book"&&req.method==="POST"){
      const b=await req.json(),f=findGroup(b.groupId);
      const name=String(b.name||"").trim(),email=String(b.email||"").trim(),phone=String(b.phone||"").trim();
      if(!f||name.length<2||!/^\S+@\S+\.\S+$/.test(email)||phone.replace(/\D/g,"").length<10)return J({error:"Please check your name, email and phone number."},400);
      const seats=[...new Set(b.seats||[])];
      if(!seats.length)return J({error:"Please choose a seat."},400);
      if(seats.length>MAX_SEATS)return J({error:`You can book only ${MAX_SEATS} seat${MAX_SEATS>1?"s":""}.`},400);
      for(const s of seats){const [t,n]=s.split("-").map(Number),tb=f.group.tables.find(x=>x.n===t);
        if(!tb||!(n>=1&&n<=tb.seats))return J({error:"Invalid seat selected."},400)}
      const id="ART-"+Array.from({length:6},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[Math.floor(Math.random()*32)]).join("");
      const got=[],gotG=[];
      const undo=()=>Promise.all([...got.map(g=>seatS.delete("s:"+g)),...gotG.map(k=>seatS.delete(k))]);
      // One booking per guest: lock the email and phone number first (atomic, so two taps can't slip through)
      if(ONE_BOOKING_PER_GUEST){
        for(const k of ["e:"+email.toLowerCase(),"p:"+ng(phone)]){
          let ok=(await seatS.set(k,id,{onlyIfNew:true})).modified;
          if(!ok){ // maybe a stale lock from a failed or released booking: clear it and retry once
            const old=await seatS.get(k),ob=old&&await bk.get("b:"+old,{type:"json"});
            if(!ob||ob.status!=="confirmed"){await seatS.delete(k);ok=(await seatS.set(k,id,{onlyIfNew:true})).modified}
          }
          if(!ok){await undo();return J({error:"This email or phone number has already been used to book a seat. Each guest can book only one seat. Please contact the couple if this is a mistake.",code:"duplicate_guest"},409)}
          gotG.push(k);
        }
      }
      for(const s of seats){
        const r=await seatS.set("s:"+s,id,{onlyIfNew:true});
        if(!r.modified){await undo();return J({error:`Seat Table ${s.replace("-"," Seat ")} was just taken. Please pick another.`,seat:s},409)}
        got.push(s);
      }
      const rec={id,name,email,phone,grouping:f.side.label,category:f.group.label,seats,status:"confirmed",at:new Date().toISOString()};
      try{await bk.setJSON("b:"+id,rec)}catch(e){await undo();throw e}
      try{await notifyBooked(rec)}catch(e){console.error("notify failed",e)}
      return J({ok:true,booking:pub(rec)});
    }

    if(p.startsWith("admin/")){
      const k=req.headers.get("x-admin-key");
      const isAdmin=E.ADMIN_KEY&&k===E.ADMIN_KEY,isUsher=E.USHER_KEY&&k===E.USHER_KEY;
      if(!(isAdmin||(isUsher&&(p==="admin/checkin"||p==="admin/ping"))))return J({error:"Unauthorized"},401);
      if(p==="admin/ping")return J({ok:true,role:isAdmin?"admin":"usher"});
      if(p==="admin/checkin"&&req.method==="POST"){
        const {id}=await req.json(),r=await bk.get("b:"+String(id||"").trim().toUpperCase(),{type:"json"});
        if(!r)return J({result:"invalid",reason:"Card not found"});
        const info={name:r.name,category:r.category,tables:tablesOf(r),seats:seatsOf(r),id:r.id};
        if(r.status!=="confirmed")return J({result:"invalid",reason:"Card was released / cancelled",...info});
        const now=new Date().toISOString();
        const w=await seatS.set("a:"+r.id,now,{onlyIfNew:true});
        if(!w.modified){const prev=await seatS.get("a:"+r.id);return J({result:"used",at:lag(prev),...info})}
        r.arrivedAt=now;await bk.setJSON("b:"+r.id,r);
        return J({result:"valid",at:lag(now),...info});
      }
      if(p==="admin/orphans"){
        const {blobs:sb}=await seatS.list({prefix:"s:"}),out=[];
        for(const x of sb){const ref=await seatS.get(x.key),r=await bk.get("b:"+ref,{type:"json"});
          if(!r||r.status!=="confirmed")out.push({seat:x.key.slice(2),ref,reason:r?"booking "+r.status:"no booking record"})}
        return J(out);
      }
      if(p==="admin/freeseat"&&req.method==="POST"){
        const {seat}=await req.json(),ref=await seatS.get("s:"+seat);
        if(!ref)return J({error:"Seat is already free"},404);
        const r=await bk.get("b:"+ref,{type:"json"});
        if(r&&r.status==="confirmed")return J({error:"Seat belongs to a confirmed booking. Use Release seats instead."},400);
        await seatS.delete("s:"+seat);return J({ok:true});
      }
      const {blobs}=await bk.list({prefix:"b:"});
      const all=(await Promise.all(blobs.map(b=>bk.get(b.key,{type:"json"})))).filter(Boolean).sort((a,b)=>a.at<b.at?1:-1);
      if(p==="admin/list")return J(all);
      if(p==="admin/release"&&req.method==="POST"){
        const {id}=await req.json(),r=await bk.get("b:"+id,{type:"json"});
        if(!r||r.status!=="confirmed")return J({error:"Booking not found or already released."},404);
        await Promise.all(r.seats.map(s=>seatS.delete("s:"+s)));
        for(const k of ["e:"+String(r.email).toLowerCase(),"p:"+ng(r.phone)]){if(await seatS.get(k)===r.id)await seatS.delete(k)} // let the guest rebook
        r.status="released";r.releasedAt=new Date().toISOString();await bk.setJSON("b:"+id,r);
        await notifyReleased(r);return J({ok:true});
      }
      if(p==="admin/export"){
        const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Guests");
        ws.columns=[["Ref","id"],["Name","name"],["Email","email"],["Phone","phone"],["Grouping","grouping"],["Category","category"],["Table(s)","t"],["Seat(s)","s"],["Status","status"],["Booked at","at"],["Arrived at","arr"]].map(([header,key])=>({header,key,width:22}));
        ws.getRow(1).font={bold:true};
        all.forEach(r=>ws.addRow({...r,t:tablesOf(r),s:seatsOf(r),arr:lag(r.arrivedAt)}));
        return new Response(await wb.xlsx.writeBuffer(),{headers:{"content-type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","content-disposition":"attachment; filename=wedding-guests.xlsx"}});
      }
    }
    return J({error:"Not found"},404);
  }catch(e){console.error(e);return J({error:"Server error. Please try again."},500)}
};
