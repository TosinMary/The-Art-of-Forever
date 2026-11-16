(async () => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const api = async (path, opt) => { const r = await fetch("/api/" + path, opt); return { ok: r.ok, status: r.status, d: await r.json() }; };
  let cfg, taken = new Set(), side, picked = new Set();

  function showCard(c) {
    $("app").hidden = true; $("cardWrap").hidden = false;
    $("cn").textContent = c.name; $("cg").textContent = c.grouping; $("cc").textContent = c.category;
    const sameCat = c.grouping === c.category;
    $("cc").style.display = sameCat ? "none" : ""; if ($("cc").previousElementSibling) $("cc").previousElementSibling.style.display = sameCat ? "none" : "";
    if ($("cg").previousElementSibling) $("cg").previousElementSibling.textContent = sameCat ? "Guest" : "Grouping";
    $("ct").textContent = c.tables; $("cd").textContent = c.date; $("ci").textContent = c.id;
    const pend = c.status === "pending", decl = c.status === "declined";
    $("ch").textContent = pend ? "Seat request received" : decl ? "Request not approved" : "Access Card";
    if (pend || decl) {
      $("qr").style.display = "none"; $("ci").style.display = "none";
      document.querySelectorAll(".photo-note").forEach((n) => { n.style.display = "none"; });
      $("cnote").textContent = pend
        ? "Your seat is being held while the couple confirm that you are an invited guest. Your access card will be emailed to you (and sent by SMS) once it is approved. You can come back to this page to check."
        : "Sorry, your request was not approved because you are not an approved invited guest. Please contact the couple for more information.";
      try { pend ? localStorage.setItem("myPending", JSON.stringify({ ref: c.id })) : localStorage.removeItem("myPending"); } catch (e) {}
      if (pend && $("mailhint")) $("mailhint").innerHTML = "<b>Check your email.</b> We have emailed you to confirm your request. If you cannot find it, look in <b>Promotions</b> or <b>Spam</b>.";
      else if ($("mailhint")) $("mailhint").style.display = "none";
    }
    if (c.status === "uninvited") {
      $("ch").textContent = "Reservation cancelled";
      $("qr").style.display = "none"; $("ci").style.textDecoration = "line-through"; $("card").style.opacity = ".7";
      document.querySelectorAll(".photo-note").forEach((n) => { n.style.display = "none"; });
      if ($("mailhint")) $("mailhint").style.display = "none";
      $("cnote").textContent = "This reservation is no longer valid because you are not an approved invited guest. Please contact the couple for approval.";
      try { localStorage.removeItem("myRef"); } catch (e) {}
    }
    if (c.status === "released") {
      $("cnote").textContent = "This reference is no longer valid. Please rebook your seat or contact the couple.";
      $("qr").style.display = "none"; document.querySelectorAll(".photo-note").forEach((n) => { n.style.display = "none"; });
      $("ci").style.textDecoration = "line-through"; $("card").style.opacity = ".7";
    }
    $("qr").innerHTML = ""; new QRCode($("qr"), { text: c.id + "|" + c.name, width: 160, height: 160 });
    if ($("photoLink")) $("photoLink").href = "photos.html?ref=" + encodeURIComponent(c.id);
    if (c.status === "confirmed") { try { localStorage.removeItem("myPending"); localStorage.setItem("myRef", JSON.stringify({ ref: c.id, name: c.name })); } catch (e) {} }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Returning guest on this phone: show their reference again
  try {
    const mr = JSON.parse(localStorage.getItem("myRef") || "null");
    if (mr && /^ART-/.test(mr.ref) && !new URLSearchParams(location.search).get("card")) {
      $("mine").hidden = false; $("mineRef").textContent = mr.ref;
      $("mineCard").href = "rsvp.html?card=" + encodeURIComponent(mr.ref); $("minePhoto").href = "photos.html?ref=" + encodeURIComponent(mr.ref);
    }
  } catch (e) {}
  window.addEventListener("myref-cleared", () => { $("mine").hidden = true; });
  // Returning guest who has a request waiting: show where it stands
  (async () => {
    try {
      const mp = JSON.parse(localStorage.getItem("myPending") || "null");
      if (!mp || !/^ART-/.test(mp.ref) || new URLSearchParams(location.search).get("card")) return;
      const r = await fetch("/api/card?id=" + encodeURIComponent(mp.ref), { cache: "no-store" }); if (!r.ok && r.status !== 404) return;
      const d = r.status === 404 ? { status: "gone" } : await r.json(), box = $("pendingNote");
      if (d.status === "pending") { box.hidden = false; box.innerHTML = "<b>Your seat request is waiting for the couple's approval.</b><br>Request reference " + d.id + ". Your access card will be emailed once it is approved. <a class=\"text-link\" href=\"rsvp.html?card=" + encodeURIComponent(d.id) + "\">View my request</a>"; }
      else if (d.status === "confirmed") { localStorage.removeItem("myPending"); localStorage.setItem("myRef", JSON.stringify({ ref: d.id, name: (d.name || "").split(" ")[0] })); $("mine").hidden = false; $("mineRef").textContent = d.id; $("mineCard").href = "rsvp.html?card=" + encodeURIComponent(d.id); $("minePhoto").href = "photos.html?ref=" + encodeURIComponent(d.id); if (window.showMyRefChip) window.showMyRefChip(); }
      else { localStorage.removeItem("myPending"); if (d.status === "declined") { box.hidden = false; box.innerHTML = "<b>Your last seat request was not approved.</b><br>Please contact the couple for more information."; } }
    } catch (e) {}
  })();
  // "Show my reference on this device" (email + phone number it was booked with)
  $("frOpen").onclick = () => { $("frBox").hidden = !$("frBox").hidden; };
  $("frGo").onclick = async () => {
    $("frGo").disabled = true; $("frMsg").textContent = ""; $("frMsg").style.color = "";
    const r = await api("find-reference", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: $("frEmail").value, phone: $("frPhone").value }) });
    $("frGo").disabled = false;
    if (!r.ok) { $("frMsg").textContent = r.d.error || "Could not find your booking."; return; }
    try { localStorage.setItem("myRef", JSON.stringify({ ref: r.d.ref, name: r.d.name })); } catch (e) {}
    $("mine").hidden = false; $("mineRef").textContent = r.d.ref;
    $("mineCard").href = "rsvp.html?card=" + encodeURIComponent(r.d.ref); $("minePhoto").href = "photos.html?ref=" + encodeURIComponent(r.d.ref);
    $("frBox").hidden = true; $("mine").scrollIntoView({ behavior: "smooth", block: "center" });
  };
  // "Email my access card again" (sent only to the address it was booked with)
  $("rsOpen").onclick = () => { $("rsBox").hidden = !$("rsBox").hidden; };
  $("rsGo").onclick = async () => {
    $("rsGo").disabled = true; $("rsMsg").textContent = ""; $("rsMsg").style.color = "";
    const r = await api("resend-card", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: $("rsEmail").value }) });
    $("rsGo").disabled = false; $("rsMsg").style.color = r.ok ? "#1f8a55" : ""; $("rsMsg").textContent = r.ok ? r.d.message : (r.d.error || "Could not send. Please try again.");
  };

  const cardId = new URLSearchParams(location.search).get("card");
  if (cardId) {
    const r = await api("card?id=" + encodeURIComponent(cardId));
    if (r.ok) return showCard(r.d);
    $("err").textContent = "We could not find that access card.";
  }

  const c = await api("config"); cfg = c.d;
  const reqText = cfg.REQUIRE_APPROVAL ? "Request my seat" : "Confirm & get my access card";
  $("go").textContent = reqText;
  if (cfg.REQUIRE_APPROVAL) { const ld = $("lead"); if (ld) ld.textContent = "Choose your group and seat. The couple will confirm your invitation, then your access card is sent to you by email and SMS. Saturday, 5 December 2026."; }
  const maxSeats = cfg.MAX_SEATS || 1;
  $("seatBox").querySelector("h2").textContent = (cfg.SIDES.length === 1 && cfg.SIDES[0].groups.length === 1 ? "2. " : "3. ") + (maxSeats === 1 ? "Pick your seat" : "Pick your seat(s)");
  $("seatBox").querySelector(".legend").insertAdjacentHTML("beforebegin", `<p style="margin:0 0 .6rem;color:var(--muted)">Each guest can book ${maxSeats === 1 ? "one seat" : "up to " + maxSeats + " seats"}.</p>`);
  const loadTaken = async () => { taken = new Set((await api("taken")).d); };
  await loadTaken();

  $("sides").innerHTML = cfg.SIDES.map((s) => `<button type="button" data-id="${s.id}">${esc(s.label)}</button>`).join("");
  $("sides").onclick = (e) => {
    const b = e.target.closest("button"); if (!b) return;
    side = cfg.SIDES.find((s) => s.id === b.dataset.id);
    [...$("sides").children].forEach((x) => x.classList.toggle("on", x === b));
    $("group").innerHTML = side.groups.map((g) => `<option value="${g.id}">${esc(g.label)}</option>`).join("");
    $("gw").hidden = side.groups.length < 2;
    ["det", "seatBox", "bar"].forEach((i) => ($(i).hidden = false));
    render();
  };
  // Only one guest type: skip the "Who are you with?" step and go straight to the details and seat map
  const single = cfg.SIDES.length === 1 && cfg.SIDES[0].groups.length === 1;
  if (single) {
    $("sides").closest(".box").hidden = true;
    $("det").querySelector("h2").textContent = "1. Your details";
    $("sides").querySelector("button").click();
  }
  $("group").onchange = render;
  const grp = () => side.groups.find((g) => g.id === $("group").value) || side.groups[0];

  function render() {
    picked.clear();
    $("tables").innerHTML = grp().tables.map((t) => {
      let free = 0;
      const seats = Array.from({ length: t.seats }, (_, i) => {
        const k = t.n + "-" + (i + 1), tk = taken.has(k); if (!tk) free++;
        return `<button type="button" class="seat" data-k="${k}" ${tk ? "disabled title='Taken'" : ""}>${i + 1}</button>`;
      }).join("");
      return `<div class="tbl"><h3>Table ${t.n}</h3><small>${free} of ${t.seats} free</small><div class="seats">${seats}</div></div>`;
    }).join("");
    upd();
  }
  $("tables").onclick = (e) => {
    const b = e.target.closest(".seat"); if (!b || b.disabled) return;
    const k = b.dataset.k, max = cfg.MAX_SEATS || 1;
    $("err").textContent = "";
    if (picked.has(k)) { picked.delete(k); b.classList.remove("sel"); }
    else {
      if (picked.size >= max) {
        if (max === 1) { // single seat: tapping another seat swaps the selection
          picked.clear(); document.querySelectorAll(".seat.sel").forEach((x) => x.classList.remove("sel"));
        } else { $("err").textContent = "You can book only " + max + " seats."; return; }
      }
      picked.add(k); b.classList.add("sel");
    }
    upd();
  };
  function upd() {
    $("sum").textContent = picked.size ? picked.size + (picked.size > 1 ? " seats: " : " seat: ") + [...picked].map((k) => "T" + k.replace("-", " S")).join(", ") : "No seat selected yet";
    $("go").disabled = !picked.size;
  }

  $("go").onclick = async () => {
    $("err").textContent = "";
    $("go").disabled = true; $("go").textContent = "Booking...";
    const r = await api("book", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ website: $("website") ? $("website").value : "", name: $("name").value, email: $("email").value, phone: $("phone").value, groupId: grp().id, seats: [...picked] }),
    });
    $("go").textContent = reqText;
    if (r.ok) return showCard(r.d.booking);
    if (r.status === 429) { $("go").disabled = false; }
    $("err").textContent = r.d.error || "Something went wrong.";
    if (r.status === 409 && r.d.seat) { await loadTaken(); render(); } else upd();
  };
})();
