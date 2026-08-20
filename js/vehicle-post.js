(() => {
  const get = (id) => document.getElementById(id);
  const value = (id) => (get(id)?.value || "").trim();

  function formatPrice(raw) {
    const cleaned = String(raw || "").replace(/[$,\s]/g, "");
    const number = Number(cleaned);
    return (!Number.isFinite(number) || cleaned === "") ? "" : number.toLocaleString("en-US", { maximumFractionDigits: 0 });
  }

  function formatMileage(raw) {
    const cleaned = String(raw || "").replace(/[,\s]/g, "");
    const number = Number(cleaned);
    return (!Number.isFinite(number) || cleaned === "") ? raw : number.toLocaleString("en-US");
  }

  function vehicleName() {
    return [value("postYear"), value("postMake"), value("postModel"), value("postTrim")].filter(Boolean).join(" ");
  }

  function buildDetails() {
    const details = [];
    if (value("postIssue1")) details.push(`• ${value("postIssue1")}`);
    if (value("postIssue2")) details.push(`• ${value("postIssue2")}`);
    if (value("postRepairs")) details.push(`• Recent maintenance: ${value("postRepairs")}`);
    if (value("postNotes")) details.push(`• ${value("postNotes")}`);
    if (!details.length) details.push("• See vehicle for overall condition");
    return details.join("\n");
  }

  function generatePosts() {
    const name = vehicleName();
    const mileage = formatMileage(value("postMileage"));
    const price = formatPrice(value("postPrice"));
    const titleStatus = value("postTitleStatus");
    const runs = value("postRuns");
    const ac = value("postAc");
    const transmission = value("postTransmission");
    const details = buildDetails();
    const displayPrice = price ? `$${price}` : "$";
    const displayMileage = mileage || "Mileage not listed";

    get("marketplaceTitle").value = `${name || "Vehicle"} - ${titleStatus} - ${displayPrice} Cash`;

    get("shortPostOutput").value = `🚗 ${name || "Vehicle"} — ${displayPrice} CASH\n\n📍 ${displayMileage} miles\n✅ Runs & Drives: ${runs}\n❄️ A/C: ${ac}\n📝 ${titleStatus}\n\nWHAT WE KNOW:\n${details}\n\n💰 CASH PRICE: ${displayPrice}\n\n⚠️ AS-IS — NO WARRANTY\n\nUsed vehicle. We do not claim our vehicles are perfect. Buyers are encouraged to inspect or have the vehicle inspected before purchasing.\n\nNO BOUNDS AUTO | NBA LLC\nCash Cars. Fair Prices. Less Debt.\n\n📩 Message for availability.`;

    get("fullPostOutput").value = `🚗 ${name || "Vehicle"} — ${displayPrice} CASH\n\nVEHICLE INFORMATION\nMileage: ${displayMileage}\nRuns & Drives: ${runs}\nA/C: ${ac}\nTransmission: ${transmission}\nTitle: ${titleStatus}\n\nWHAT WE KNOW:\n${details}\n\n💰 CASH PRICE: ${displayPrice}\n\nNO BOUNDS AUTO | NBA LLC\n\nOur mission is simple: provide affordable cash vehicles that can help people avoid or minimize car payments and additional debt.\n\nWe understand that these are used vehicles. We are not representing these vehicles as perfect, restored, or problem-free.\n\n⚠️ ALL VEHICLES ARE SOLD AS-IS — NO WARRANTY.\n\nWe disclose the vehicle condition and known issues to the best of our knowledge. Buyers are encouraged to inspect the vehicle, test-drive it, or have it inspected by a mechanic before purchasing.\n\nCash Cars. Fair Prices. Less Debt.\n\n📍 No Bounds Auto\n12225 AR 365\nLittle Rock, AR 72206\n\n📞 501-272-9414\n📩 Message for availability or to schedule a test drive.`;
  }

  async function copyOutput(targetId, button) {
    const output = get(targetId);
    const text = output?.value || "";
    if (!text) return alert("Generate the vehicle posts first.");
    try { await navigator.clipboard.writeText(text); }
    catch { output.removeAttribute("readonly"); output.select(); document.execCommand("copy"); output.setAttribute("readonly", ""); }
    const original = button.textContent;
    button.textContent = "Copied!";
    setTimeout(() => button.textContent = original, 1400);
  }

  function clearForm() {
    ["postYear","postMake","postModel","postTrim","postMileage","postPrice","postIssue1","postIssue2","postRepairs","postNotes"].forEach(id => { if (get(id)) get(id).value = ""; });
    ["postTitleStatus","postRuns","postAc","postTransmission"].forEach(id => { if (get(id)) get(id).selectedIndex = 0; });
    ["marketplaceTitle","shortPostOutput","fullPostOutput"].forEach(id => { if (get(id)) get(id).value = ""; });
  }

  get("generateVehiclePosts")?.addEventListener("click", generatePosts);
  get("clearVehiclePost")?.addEventListener("click", clearForm);
  document.querySelectorAll(".copy-btn").forEach(button => button.addEventListener("click", () => copyOutput(button.dataset.copyTarget, button)));
  if (get("postYearFooter")) get("postYearFooter").textContent = new Date().getFullYear();
})();
