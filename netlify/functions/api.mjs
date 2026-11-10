import {getStore} from "@netlify/blobs";
import {timingSafeEqual,randomInt,randomBytes,createHmac} from "node:crypto";
import ExcelJS from "exceljs";
import {SIDES,DATE,MAX_SEATS,ONE_BOOKING_PER_GUEST,PROGRAM,PROGRAM_UNLOCK,PHOTOS_OPEN,PHOTOS_UPLOAD_UNTIL,MAX_PHOTOS_PER_GUEST,GENERIC_PHOTO_REF,findGroup} from "./config.mjs";

export const config={path:"/api/*"};
const E=process.env;
const J=(d,s=200)=>new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json","cache-control":"no-store","x-content-type-options":"nosniff"}});
// Compare secrets in constant time so response timing cannot leak the key
const same=(a,b)=>{a=Buffer.from(String(a||""));b=Buffer.from(String(b||""));return a.length===b.length&&timingSafeEqual(a,b)};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const tablesOf=r=>[...new Set(r.seats.map(s=>s.split("-")[0]))].join(", ");
const seatsOf=r=>r.seats.map(s=>"T"+s.replace("-"," S")).join(", ");
const pub=r=>({id:r.id,name:r.name,grouping:r.grouping,category:r.category,tables:tablesOf(r),seats:seatsOf(r),date:DATE,status:r.status});
const lag=t=>t?new Date(t).toLocaleString("en-NG",{timeZone:"Africa/Lagos"}):"";
// ---------- Photo wall helpers ----------
const refCache=new Map();   // remembers "is this reference still valid?" for a few seconds so every photo request does not hit the database
const photoState=()=>{let o=new Date(E.PHOTOS_OPEN_AT||PHOTOS_OPEN);if(isNaN(o))o=new Date(PHOTOS_OPEN);let u=new Date(E.PHOTOS_UPLOAD_UNTIL_AT||PHOTOS_UPLOAD_UNTIL);if(isNaN(u))u=new Date(PHOTOS_UPLOAD_UNTIL);const n=Date.now();
  return{open:n>=o.getTime(),uploadOpen:n>=o.getTime()&&n<=u.getTime(),openAt:o.toISOString(),uploadUntil:u.toISOString(),now:n}};
const tokSecret=()=>E.PHOTO_SECRET||("photo|"+(E.ADMIN_KEY||""));
const signTok=(role,ref,name)=>{const p=Buffer.from(JSON.stringify({r:role,f:ref,n:name,e:Date.now()+72*3600e3})).toString("base64url");
  return p+"."+createHmac("sha256",tokSecret()).update(p).digest("base64url")};
const verifyTok=t=>{if(!t||!(E.PHOTO_SECRET||E.ADMIN_KEY))return null;const [p,sig]=String(t).split(".");if(!p||!sig)return null;
  if(!same(sig,createHmac("sha256",tokSecret()).update(p).digest("base64url")))return null;
  try{const o=JSON.parse(Buffer.from(p,"base64url").toString());return o.e>Date.now()?o:null}catch(e){return null}};
const clean2=(v,max)=>String(v??"").replace(/[\u0000-\u001f\u007f<>]/g,"").trim().slice(0,max);
const code6=()=>Array.from({length:6},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(32)]).join("");
const normRef=t=>{let id=String(t||"").split("|")[0].trim().toUpperCase().replace(/\s+/g,"");
  if(/^ART-[A-Z0-9]{6}$/.test(id)||/^GST-[A-Z0-9]{6}$/.test(id))return id;if(/^[A-Z0-9]{6}$/.test(id))return"ART-"+id;if(/^ART[A-Z0-9]{6}$/.test(id))return"ART-"+id.slice(3);return id};
const shortName=n=>{const w=String(n||"Guest").trim().split(/\s+/);return w.length>1?w[0]+" "+w[w.length-1][0]+".":w[0]};
const toAB=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
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
<tr><td style="padding:14px 22px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6ecd9;border:1px solid #dcc58f;border-radius:10px"><tr><td style="padding:12px 14px;${F}font-size:13px;line-height:1.55;color:#3b1f27;text-align:center"><b>Your reference <span style="color:#5b1a2a;letter-spacing:2px">${r.id}</span> is also your Photo Wall code.</b><br>On the wedding day, use it to sign in, take photos and see everyone&#8217;s pictures.<br><a href="${site()}/photos.html?ref=${r.id}" style="color:#7a1f3d">Open the Photo Wall</a></td></tr></table></td></tr>
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
    sms(r.phone,`Hi ${r.name.split(" ")[0]}, your seat is confirmed for Tosin & Raphael's wedding, ${DATE}. ${r.category}, Table ${tablesOf(r)}. Ref ${r.id} (also your Photo Wall code). Card: ${site()}/rsvp.html?card=${r.id}`),
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

export default async (req,context)=>{
  // Send emails/SMS in the background when the platform allows it, so the page doesn't wait for them
  const later=async(p)=>{await p};   // wait for the email/SMS to be handed to Brevo/Termii so nothing is lost when the function ends
  const u=new URL(req.url),p=u.pathname.replace(/^\/api\//,"");
  const seatS=getStore("seats"),bk=getStore("bookings"),rl=getStore("ratelimit");
  const findByEmail=async em=>{
    const bid=await seatS.get("e:"+em),rec=bid?await bk.get("b:"+bid,{type:"json"}):null;
    if(rec&&rec.status==="confirmed")return rec;
    const {blobs}=await bk.list({prefix:"b:"});   // fallback: look through all bookings (covers older bookings made before the index existed)
    const all=await Promise.all(blobs.map(x=>bk.get(x.key,{type:"json"}).catch(()=>null)));
    return all.find(r=>r&&r.status==="confirmed"&&String(r.email).toLowerCase()===em)||null;
  };
  // Simple per-visitor rate limiting (stops password guessing and booking spam)
  const ip=String((context&&context.ip)||req.headers.get("x-nf-client-connection-ip")||"unknown").replace(/[^\w.:-]/g,"_");
  const tooMany=async(bucket,max,win)=>{const r=await rl.get(bucket+":"+ip,{type:"json"}).catch(()=>null);return !!r&&Date.now()-r.t<win&&r.n>=max};
  const hit=async(bucket,win)=>{const k=bucket+":"+ip;let r=await rl.get(k,{type:"json"}).catch(()=>null);const now=Date.now();if(!r||now-r.t>=win)r={n:0,t:now};r.n++;await rl.setJSON(k,r).catch(()=>{})};
  try{
    // ===== Photo wall: everyone with a valid card can view; only the owner (or the couple) can download the full-size photo =====
    // "Show my reference on this device": the guest proves it is them with the email AND phone number they booked with
    if(p==="find-reference"&&req.method==="POST"){
      if(await tooMany("findref",10,3600000))return J({error:"Too many attempts. Please try again in an hour."},429);
      await hit("findref",3600000);
      let b={};try{b=JSON.parse(await req.text()||"{}")}catch(e){}
      const em=clean2(b.email,120).toLowerCase(),phn=ng(clean2(b.phone,20)),fail="We could not match those details. Please use the same email and phone number you booked with.";
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)||phn.length<12)return J({error:fail},404);
      const fk="findref:"+em;let f=await rl.get(fk,{type:"json"}).catch(()=>null);
      if(f&&Date.now()-f.t<3600000&&f.n>=5)return J({error:"Too many attempts for this email. Please wait an hour, or use \"Email my access card again\"."},429);
      const rec=await findByEmail(em);
      if(rec&&rec.status==="confirmed"&&ng(rec.phone)===phn)return J({ok:true,ref:rec.id,name:String(rec.name).split(" ")[0],category:rec.category,table:tablesOf(rec)});
      f=(!f||Date.now()-f.t>=3600000)?{n:0,t:Date.now()}:f;f.n++;await rl.setJSON(fk,f).catch(()=>{});
      return J({error:fail},404);
    }
    // "I lost my reference": email the access card again to the address it was booked with (never shows it on screen)
    if(p==="resend-card"&&req.method==="POST"){
      if(await tooMany("resend",5,3600000))return J({error:"Too many requests. Please try again in an hour."},429);
      await hit("resend",3600000);
      let b={};try{b=JSON.parse(await req.text()||"{}")}catch(e){}
      const em=clean2(b.email,120).toLowerCase();
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))return J({error:"Please enter a valid email address."},400);
      const rec=await findByEmail(em);
      console.log("resend-card: "+(rec?"confirmed booking found":"no confirmed booking found for that email"));
      if(rec&&rec.status==="confirmed"){
        const last=await rl.get("resend:"+em,{type:"json"}).catch(()=>null);
        if(!last||Date.now()-last.t>300000){
          await rl.setJSON("resend:"+em,{t:Date.now()});
          await later(Promise.allSettled([
            email(rec.email,"Your Access Card \u00b7 Tosin & Raphael\u2019s Wedding, 5 December 2026",cardHtml(rec)),
            sms(rec.phone,`Hi ${rec.name.split(" ")[0]}, your reference is ${rec.id} (also your Photo Wall code). Card: ${site()}/rsvp.html?card=${rec.id}`)]));
        }
      }
      return J({ok:true,message:"If a booking exists for that email address, we have sent the access card to it. Please check your inbox and spam folder."});
    }
    if(p.startsWith("photo")){
      const ph=getStore("photos"),pm=getStore("photometa"),st=photoState();
      if(p==="photo-status")return J(st);
      if(p==="photo-login"&&req.method==="POST"){
        if(await tooMany("photologin",15,900000))return J({error:"Too many attempts. Please wait 15 minutes."},429);
        let b={};try{b=JSON.parse(await req.text()||"{}")}catch(e){}
        if(b.adminKey){
          if(!E.ADMIN_KEY||!same(b.adminKey,E.ADMIN_KEY)){await hit("photologin",900000);return J({error:"Wrong key."},401)}
          return J({token:signTok("admin","admin","The Couple"),role:"admin",name:"The Couple"});
        }
        if(!st.open)return J({error:"The photo wall is not open yet.",...st},403);
        const ref=normRef(b.ref),generic=normRef(E.PHOTO_GUEST_CODE||GENERIC_PHOTO_REF);
        if(ref===generic){   // shared code for guests without a booking: each person gets their own personal code
          const nm=clean2(b.name,60);
          if(nm.length<2)return J({needName:true});
          if(await tooMany("walkin",10,3600000))return J({error:"Too many new sign-ins from this connection. Please try again later."},429);
          const {blobs:wl}=await pm.list({prefix:"w:"});if(wl.length>=500)return J({error:"The photo wall is full. Please see the couple."},429);
          await hit("walkin",3600000);
          const code="GST-"+code6();await pm.setJSON("w:"+code,{name:nm,at:new Date().toISOString()});
          return J({token:signTok("guest",code,nm),role:"guest",name:nm.split(" ")[0],ref:code,personal:true});
        }
        if(/^GST-[A-Z0-9]{6}$/.test(ref)){   // returning guest who signed in with the shared code before
          const w=await pm.get("w:"+ref,{type:"json"}).catch(()=>null);
          if(!w){await hit("photologin",900000);return J({error:"We could not find that code. Please check it and try again."},401)}
          return J({token:signTok("guest",ref,w.name),role:"guest",name:String(w.name).split(" ")[0],ref});
        }
        const r=/^ART-[A-Z0-9]{6}$/.test(ref)?await bk.get("b:"+ref,{type:"json"}):null;
        if(!r||r.status!=="confirmed"){await hit("photologin",900000);return J({error:"We could not find that reference. Please check the reference on your access card."},401)}
        return J({token:signTok("guest",r.id,r.name),role:"guest",name:String(r.name).split(" ")[0],ref:r.id});
      }
      const auth=verifyTok((req.headers.get("authorization")||"").replace(/^Bearer\s+/i,""));
      if(!auth)return J({error:"Please sign in again."},401);
      const admin=auth.r==="admin",ref=auth.f;
      if(!admin){   // a released or cancelled booking loses photo-wall access immediately, even if the guest is still signed in
        const ttl=Number(E.REF_CACHE_MS??15000),c=refCache.get(ref);let live;
        if(c&&Date.now()-c.t<ttl)live=c.ok;
        else{
          if(/^ART-/.test(ref)){const r=await bk.get("b:"+ref,{type:"json"}).catch(()=>null);live=!!r&&r.status==="confirmed"}
          else live=!!(await pm.get("w:"+ref,{type:"json"}).catch(()=>null));
          refCache.set(ref,{ok:live,t:Date.now()});
        }
        if(!live)return J({error:"This reference is no longer valid. Please contact the couple if you think this is a mistake.",revoked:true},401);
      }
      if(!st.open&&!admin)return J({error:"The photo wall is not open yet.",...st},403);
      const glist=async r=>(await pm.get("g:"+r,{type:"json"}).catch(()=>null))||[];

      if(p==="photos"){
        const mine=u.searchParams.get("mine")==="1",offset=Math.max(0,+u.searchParams.get("offset")||0),limit=Math.min(100,Math.max(1,+u.searchParams.get("limit")||60));
        const gl=await glist(ref);
        let ids;
        if(mine&&!admin)ids=[...gl].sort();
        else{const {blobs}=await pm.list({prefix:"m:"});ids=blobs.map(x=>x.key.slice(2)).sort()}   // ids start with an inverted timestamp, so sorted = newest first
        const metas=(await Promise.all(ids.slice(offset,offset+limit).map(id=>pm.get("m:"+id,{type:"json"}).catch(()=>null)))).filter(Boolean);
        return J({total:ids.length,items:metas.map(m=>({id:m.id,by:m.by,at:m.at,w:m.w,h:m.h,mine:admin||m.ref===ref})),
          uploadOpen:st.uploadOpen||admin,me:{role:auth.r,name:auth.n,ref:auth.f,count:gl.length,max:MAX_PHOTOS_PER_GUEST}});
      }
      if(p==="photo"&&req.method==="GET"){
        const id=u.searchParams.get("id")||"",size=u.searchParams.get("size")||"thumb";
        if(!/^\d{13}-[0-9a-f]{8}$/.test(id)||!["thumb","view","full"].includes(size))return J({error:"Not found"},404);
        const m=await pm.get("m:"+id,{type:"json"});if(!m)return J({error:"Not found"},404);
        if(size==="full"&&!admin&&m.ref!==ref)return J({error:"Only the person who took this photo can download it."},403);
        const buf=await ph.get(size[0]+":"+id,{type:"arrayBuffer"});if(!buf)return J({error:"Not found"},404);
        const h={"content-type":"image/jpeg","x-content-type-options":"nosniff","cache-control":"private, max-age=3600"};
        if(size==="full"&&u.searchParams.get("dl")==="1")h["content-disposition"]=`attachment; filename="ArtFullyTee-${id.slice(14)}.jpg"`;
        return new Response(buf,{headers:h});
      }
      if(p==="photo-upload"&&req.method==="POST"){
        if(!st.uploadOpen&&!admin)return J({error:"Photo uploads are closed."},403);
        if(await tooMany("photoup",80,600000))return J({error:"Too many uploads. Please wait a few minutes."},429);
        await hit("photoup",600000);
        const gl=await glist(ref);
        if(!admin&&gl.length>=MAX_PHOTOS_PER_GUEST)return J({error:`You have reached the limit of ${MAX_PHOTOS_PER_GUEST} photos.`},400);
        let fd;try{fd=await req.formData()}catch(e){return J({error:"Bad upload."},400)}
        const parts={};
        for(const [k,max] of [["thumb",120e3],["view",700e3],["full",3.2e6]]){
          const f=fd.get(k);if(!f||typeof f.arrayBuffer!=="function"||f.size>max||f.size<100)return J({error:"Invalid photo."},400);
          const buf=Buffer.from(await f.arrayBuffer());
          if(!(buf[0]===0xFF&&buf[1]===0xD8&&buf[2]===0xFF))return J({error:"Only JPEG photos are accepted."},400);
          parts[k]=buf;
        }
        const w=Math.min(8000,Math.max(1,parseInt(fd.get("w"))||1)),h=Math.min(8000,Math.max(1,parseInt(fd.get("h"))||1));
        const id=String(9e12-Date.now()).padStart(13,"0")+"-"+randomBytes(4).toString("hex");
        await Promise.all([ph.set("t:"+id,toAB(parts.thumb)),ph.set("v:"+id,toAB(parts.view)),ph.set("f:"+id,toAB(parts.full))]);
        await pm.setJSON("m:"+id,{id,ref,by:shortName(auth.n),at:new Date().toISOString(),w,h});
        gl.push(id);await pm.setJSON("g:"+ref,gl);
        return J({ok:true,id,count:gl.length});
      }
      if(p==="photo-delete"&&req.method==="POST"){
        if(!st.uploadOpen&&!admin)return J({error:"Photos can no longer be deleted."},403);
        let b={};try{b=JSON.parse(await req.text()||"{}")}catch(e){}
        const id=String(b.id||"");if(!/^\d{13}-[0-9a-f]{8}$/.test(id))return J({error:"Not found"},404);
        const m=await pm.get("m:"+id,{type:"json"});if(!m)return J({error:"Not found"},404);
        if(!admin&&m.ref!==ref)return J({error:"You can only delete your own photos."},403);
        await Promise.all([ph.delete("t:"+id),ph.delete("v:"+id),ph.delete("f:"+id),pm.delete("m:"+id)]);
        await pm.setJSON("g:"+m.ref,(await glist(m.ref)).filter(x=>x!==id));
        return J({ok:true});
      }
      return J({error:"Not found"},404);
    }
    // Order of Program: the server checks the clock, so changing a phone's date or reading the page source does not reveal it early
    if(p==="program-status"||p==="program"){
      let at=new Date(E.PROGRAM_UNLOCK_AT||PROGRAM_UNLOCK);if(isNaN(at))at=new Date(PROGRAM_UNLOCK);
      const open=Date.now()>=at.getTime();
      if(p==="program-status")return J({unlocked:open,unlockAt:at.toISOString(),now:Date.now()});
      if(!open)return J({locked:true,unlockAt:at.toISOString(),now:Date.now()},403);
      return J({items:PROGRAM,date:DATE,unlockAt:at.toISOString()});
    }
    if(p==="config")return J({SIDES,DATE,MAX_SEATS});
    if(p==="taken"){const {blobs}=await seatS.list({prefix:"s:"});return J(blobs.map(b=>b.key.slice(2)))}
    if(p==="card"){if(await tooMany("card",600,600000))return J({error:"Too many requests. Please wait a few minutes."},429);await hit("card",600000);const r=await bk.get("b:"+u.searchParams.get("id"),{type:"json"});return r?J(pub(r)):J({error:"Card not found"},404)}

    if(p==="book"&&req.method==="POST"){
      if(await tooMany("book",8,600000))return J({error:"Too many attempts. Please wait a few minutes and try again."},429);
      await hit("book",600000);
      const raw=await req.text();if(raw.length>4000)return J({error:"Request too large."},413);
      let b;try{b=JSON.parse(raw)}catch(e){return J({error:"Bad request."},400)}
      if(!b||typeof b!=="object"||b.website)return J({error:"Invalid request."},400); // "website" is a hidden trap field only bots fill in
      const f=findGroup(b.groupId);
      const clean=(v,max)=>String(v??"").replace(/[\u0000-\u001f\u007f<>]/g,"").trim().slice(0,max);
      const name=clean(b.name,80),email=clean(b.email,120),phone=clean(b.phone,20);
      if(!f||name.length<2||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!/^[+\d][\d\s()-]{8,19}$/.test(phone)||phone.replace(/\D/g,"").length<10)return J({error:"Please check your name, email and phone number."},400);
      // Seats must be exactly "table-seat" (e.g. 16-3). Rebuilt from numbers so "16-03" can't sneak past the lock as a "different" seat.
      const seats=[];
      for(const x of (Array.isArray(b.seats)?b.seats:[])){const m=/^(\d{1,2})-(\d{1,2})$/.exec(String(x));if(!m)return J({error:"Invalid seat selected."},400);const key=`${+m[1]}-${+m[2]}`;if(!seats.includes(key))seats.push(key)}
      if(!seats.length)return J({error:"Please choose a seat."},400);
      if(seats.length>MAX_SEATS)return J({error:`You can book only ${MAX_SEATS} seat${MAX_SEATS>1?"s":""}.`},400);
      for(const s of seats){const [t,n]=s.split("-").map(Number),tb=f.group.tables.find(x=>x.n===t);
        if(!tb||!(n>=1&&n<=tb.seats))return J({error:"Invalid seat selected."},400)}
      const id="ART-"+Array.from({length:6},()=>"ABCDEFGHJKLMNPQRSTUVWXYZ23456789"[randomInt(32)]).join("");
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
      try{await later(notifyBooked(rec))}catch(e){console.error("notify failed",e)}
      return J({ok:true,booking:pub(rec)});
    }

    if(p.startsWith("admin/")){
      if(await tooMany("adminfail",10,900000))return J({error:"Too many wrong attempts. Try again in 15 minutes."},429);
      const k=req.headers.get("x-admin-key");
      const isAdmin=!!E.ADMIN_KEY&&same(k,E.ADMIN_KEY),isUsher=!!E.USHER_KEY&&same(k,E.USHER_KEY);
      if(!(isAdmin||(isUsher&&(p==="admin/checkin"||p==="admin/ping"))))return(await hit("adminfail",900000),J({error:"Unauthorized"},401));
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
      if(p==="admin/undocheckin"&&req.method==="POST"){
        if(!isAdmin)return J({error:"Unauthorized"},401);
        const {id}=await req.json(),r=await bk.get("b:"+id,{type:"json"});
        if(!r)return J({error:"Booking not found"},404);
        await seatS.delete("a:"+id);delete r.arrivedAt;await bk.setJSON("b:"+id,r);
        return J({ok:true});
      }
      if(p==="admin/orphans"){
        const {blobs:sb}=await seatS.list({prefix:"s:"});
        const found=await Promise.all(sb.map(async x=>{const ref=await seatS.get(x.key),r=await bk.get("b:"+ref,{type:"json"});
          return(!r||r.status!=="confirmed")?{seat:x.key.slice(2),ref,reason:r?"booking "+r.status:"no booking record"}:null}));
        return J(found.filter(Boolean));
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
        r.status="released";r.releasedAt=new Date().toISOString();
        await Promise.all([
          ...r.seats.map(s=>seatS.delete("s:"+s)),
          ...["e:"+String(r.email).toLowerCase(),"p:"+ng(r.phone)].map(async k=>{if(await seatS.get(k)===r.id)await seatS.delete(k)}), // let the guest rebook
          bk.setJSON("b:"+id,r)]);
        await later(notifyReleased(r));return J({ok:true});
      }
      if(p==="admin/export"){
        const wb=new ExcelJS.Workbook(),ws=wb.addWorksheet("Guests");
        ws.columns=[["Ref","id"],["Name","name"],["Email","email"],["Phone","phone"],["Grouping","grouping"],["Category","category"],["Table(s)","t"],["Seat(s)","s"],["Status","status"],["Attended","att"],["Booked at","at"],["Arrived at","arr"]].map(([header,key])=>({header,key,width:22}));
        ws.getRow(1).font={bold:true};
        all.forEach(r=>ws.addRow({...r,t:tablesOf(r),s:seatsOf(r),arr:lag(r.arrivedAt),att:r.status==="confirmed"?(r.arrivedAt?"Yes":"No"):"Released"}));
        const sm=wb.addWorksheet("Attendance summary");
        sm.columns=[{header:"Category",key:"c",width:30},{header:"Booked",key:"b",width:12},{header:"Attended",key:"a",width:12},{header:"Not yet arrived",key:"n",width:18}];
        sm.getRow(1).font={bold:true};
        const grp={};all.filter(r=>r.status==="confirmed").forEach(r=>{const x=grp[r.category]=grp[r.category]||{c:r.category,b:0,a:0,n:0};x.b++;r.arrivedAt?x.a++:x.n++});
        const rowsS=Object.values(grp);rowsS.forEach(x=>sm.addRow(x));
        sm.addRow(rowsS.reduce((t,x)=>({c:"TOTAL",b:t.b+x.b,a:t.a+x.a,n:t.n+x.n}),{c:"TOTAL",b:0,a:0,n:0})).font={bold:true};
        return new Response(await wb.xlsx.writeBuffer(),{headers:{"content-type":"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet","content-disposition":"attachment; filename=wedding-guests.xlsx"}});
      }
    }
    return J({error:"Not found"},404);
  }catch(e){console.error(e);return J({error:"Server error. Please try again."},500)}
};
