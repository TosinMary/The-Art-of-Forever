const T=(a,b,s=10)=>Array.from({length:b-a+1},(_,i)=>({n:a+i,seats:s}));
// ---- Booking rules (change these any time) ----
export const MAX_SEATS=1;              // seats one guest may book in a single booking
export const REQUIRE_APPROVAL=false;     // false = seats are confirmed instantly and the access card is emailed at once (you can later release an uninvited guest). true = requests are HELD until you approve them
export const ONE_BOOKING_PER_GUEST=true; // true = the same email or phone number cannot book again
// ---- Order of Program (only released to guests from the unlock time) ----
// 5:00 AM Nigerian time on the wedding day. Format: YYYY-MM-DDTHH:MM:SS+01:00 (+01:00 = Nigeria)
export const PROGRAM_UNLOCK="2026-12-05T05:00:00+01:00";
// EDIT THIS LIST: one line per item, in the order they happen. "time" and "note" are optional.
export const PROGRAM_TITLE="Wedding Reception";
export const PROGRAM=[
  {time:"",title:"Arrival of guests"},
  {time:"",title:"Introduction of special guests to the high table"},
  {time:"",title:"Bride's parents' entrance"},
  {time:"",title:"Groom's parents' entrance"},
  {time:"",title:"Couple's grand entrance"},
  {time:"",title:"Opening prayer"},
  {time:"",title:"Chairman's speech"},
  {time:"",title:"Games"},
  {time:"",title:"Cutting of the cake"},
  {time:"",title:"Couple's first dance"},
  {time:"",title:"Parents' dance with the couple"},
  {time:"",title:"Presentation of gifts"},
  {time:"",title:"Vote of thanks (by the groom)"},
  {time:"",title:"Closing prayer"},
  {time:"",title:"Dance, dance, dance"}
];
// ---- Photo wall ----
export const PHOTOS_OPEN="2026-12-05T05:00:00+01:00";         // guests can sign in from 5:00 AM on the wedding day
export const PHOTOS_UPLOAD_UNTIL="2026-12-06T06:00:00+01:00";  // 6:00 AM on 6 December 2026: guest uploads AND deletions close; viewing and downloading stay open
export const MAX_PHOTOS_PER_GUEST=5;                           // photos each guest can have on the wall
// Shared code for guests who did not book a seat on the app. Each person who uses it enters their name and gets their own personal code (GST-XXXXXX).
// Better kept private: you can also set it as the PHOTO_GUEST_CODE variable in Netlify, which takes priority over this value.
export const GENERIC_PHOTO_REF="ART-NUZ7EQ";
export const DATE="Saturday, 5 December 2026";
export const SIDES=[
{id:"guest",label:"Invited Guest",groups:[{id:"ig",label:"Invited Guest",tables:T(16,27)}]}];   // Table 16 to Table 27, 10 seats each (120 seats)
export const findGroup=id=>{for(const s of SIDES)for(const g of s.groups)if(g.id===id)return{side:s,group:g}};
