const T=(a,b,s=10)=>Array.from({length:b-a+1},(_,i)=>({n:a+i,seats:s}));
// ---- Booking rules (change these any time) ----
export const MAX_SEATS=1;              // seats one guest may book in a single booking
export const ONE_BOOKING_PER_GUEST=true; // true = the same email or phone number cannot book again
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
