const T=(a,b,s=10)=>Array.from({length:b-a+1},(_,i)=>({n:a+i,seats:s}));
// ---- Booking rules (change these any time) ----
export const MAX_SEATS=1;              // seats one guest may book in a single booking
export const ONE_BOOKING_PER_GUEST=true; // true = the same email or phone number cannot book again
// ---- Order of Program (only released to guests from the unlock time) ----
// 5:00 AM Nigerian time on the wedding day. Format: YYYY-MM-DDTHH:MM:SS+01:00 (+01:00 = Nigeria)
export const PROGRAM_UNLOCK="2026-12-05T05:00:00+01:00";
// EDIT THIS LIST: one line per item, in order. "time" and "note" are optional.
// This is sample text only. Replace it with your real programme before the wedding.
export const PROGRAM=[
  {time:"",title:"Arrival of guests and seating",note:"Please be seated at least 30 minutes before the ceremony."},
  {time:"10:00 AM",title:"Ceremony begins",note:""},
  {time:"",title:"Processional and entrance of the wedding party"},
  {time:"",title:"Opening prayer"},
  {time:"",title:"Welcome address"},
  {time:"",title:"Exchange of vows and rings"},
  {time:"",title:"Pronouncement and signing of the register"},
  {time:"",title:"Word of exhortation"},
  {time:"",title:"Cutting of the cake"},
  {time:"",title:"Couple's first dance"},
  {time:"",title:"Toasts and speeches"},
  {time:"",title:"Reception meal"},
  {time:"",title:"Closing prayer"}
];
// ---- Photo wall ----
// TESTING: the photo wall is open now. When testing is finished, change PHOTOS_OPEN to "2026-12-05T05:00:00+01:00" (wedding morning).
export const PHOTOS_OPEN="2020-01-01T00:00:00+01:00";
export const PHOTOS_UPLOAD_UNTIL="2026-12-06T06:00:00+01:00";  // 6:00 AM on 6 December 2026: guest uploads AND deletions close; viewing and downloading stay open
export const MAX_PHOTOS_PER_GUEST=5;                           // photos each guest can have on the wall
// Shared code for guests who did not book a seat on the app. Each person who uses it enters their name and gets their own personal code (GST-XXXXXX).
// Better kept private: you can also set it as the PHOTO_GUEST_CODE variable in Netlify, which takes priority over this value.
export const GENERIC_PHOTO_REF="ART-NUZ7EQ";
export const DATE="Saturday, 5 December 2026";
export const SIDES=[
{id:"bride",label:"Bride's Family",groups:[{id:"bf",label:"Bride's Family",tables:T(1,15)}]},
{id:"groom",label:"Groom's Family / Couple's Guests",groups:[
{id:"aso",label:"Aso Ebi Ladies",tables:T(16,16,7)},
{id:"men",label:"Groomsmen",tables:T(17,17,7)},
{id:"gfam",label:"Groom's Family",tables:T(18,19)},
{id:"gfr",label:"Groom's Friends",tables:T(20,20)},
{id:"bfr",label:"Bride's Friends",tables:T(21,21)},
{id:"cob",label:"Cobranet",tables:T(22,23)},
{id:"dl",label:"D.light",tables:T(24,24)},
{id:"fuoye",label:"FUOYE",tables:T(25,25)},
{id:"dami",label:"Damilola's Friends",tables:T(26,26)},
{id:"kor",label:"Korede's Friends",tables:T(27,28)},
{id:"kuda",label:"KUDA",tables:T(29,30)},
{id:"ven",label:"Vendors",tables:T(31,31,6)}]}];
export const findGroup=id=>{for(const s of SIDES)for(const g of s.groups)if(g.id===id)return{side:s,group:g}};
