(async () => {
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const api = async (path, opt) => { const r = await fetch("/api/" + path, opt); return { ok: r.ok, status: r.status, d: await r.json() }; };
  let cfg, taken = new Set(), side, picked = new Set();

  function showCard(c) {
    $("app").hidden = true; $("cardWrap").hidden = false;
    $("cn").textContent = c.name; $("cg").textContent = c.grouping; $("cc").textContent = c.category;
    $("ct").textContent = c.tables; $("cd").textContent = c.date; $("ci").textContent = c.id;
    if (c.status === "released") $("cnote").textContent = "This card is no longer valid. Please rebook your seat.";
    $("qr").innerHTML = ""; new QRCode($("qr"), { text: c.id + "|" + c.name, width: 160, height: 160 });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const cardId = new URLSearchParams(location.search).get("card");
  if (cardId) {
    const r = await api("card?id=" + encodeURIComponent(cardId));
    if (r.ok) return showCard(r.d);
    $("err").textContent = "We could not find that access card.";
  }

  const c = await api("config"); cfg = c.d;
  const maxSeats = cfg.MAX_SEATS || 1;
  $("seatBox").querySelector("h2").textContent = maxSeats === 1 ? "3. Pick your seat" : "3. Pick your seat(s)";
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
    $("go").textContent = "Confirm & get my access card";
    if (r.ok) return showCard(r.d.booking);
    if (r.status === 429) { $("go").disabled = false; }
    $("err").textContent = r.d.error || "Something went wrong.";
    if (r.status === 409 && r.d.seat) { await loadTaken(); render(); } else upd();
  };
})();
