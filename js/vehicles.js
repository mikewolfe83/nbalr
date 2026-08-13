(() => {
  const grid = document.getElementById("vehicleGrid");
  const heading = document.getElementById("inventoryHeading");
  const summary = document.getElementById("inventorySummary");

  if (!grid) return;

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function vehicleCard(vehicle) {
    const title = [vehicle.year, vehicle.make, vehicle.model]
      .filter(Boolean)
      .join(" ") || "Vehicle";

    const image = vehicle.image
      ? `<img class="vehicle-photo" src="${vehicle.image}" alt="${escapeHtml(title)}">`
      : `<div class="vehicle-placeholder"><span>Photo Coming Soon</span></div>`;

    const mileage = vehicle.mileage
      ? `<span>${Number(vehicle.mileage).toLocaleString("en-US")} miles</span>`
      : "";

    const stock = vehicle.stockNumber
      ? `<span>Stock #${escapeHtml(vehicle.stockNumber)}</span>`
      : "";

    return `
      <article class="vehicle-card">
        <div class="vehicle-media">${image}</div>
        <div class="vehicle-card-body">
          <div class="vehicle-card-topline">
            <p class="vehicle-status">${escapeHtml(vehicle.status || "Available")}</p>
            <p class="vehicle-price">${money.format(Number(vehicle.price) || 0)}</p>
          </div>
          <h3>${escapeHtml(title)}</h3>
          <div class="vehicle-meta">${mileage}${stock}</div>
          <p class="vehicle-description">${escapeHtml(vehicle.description || "Contact No Bounds Auto for details.")}</p>
          <a class="vehicle-call" href="tel:5012729414">Call for details</a>
        </div>
      </article>
    `;
  }

  async function loadVehicles() {
    try {
      const response = await fetch(`data/vehicles.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Inventory file could not be loaded.");

      const vehicles = await response.json();
      const visibleVehicles = Array.isArray(vehicles) ? vehicles.slice(0, 9) : [];

      if (!visibleVehicles.length) {
        heading.textContent = "Vehicles Coming Soon";
        summary.textContent = "New inventory will be posted here as it becomes available.";
        grid.innerHTML = `
          <div class="inventory-empty">
            <strong>Inventory Coming Soon</strong>
            <span>Call 501-272-9414 for current availability.</span>
          </div>
        `;
        return;
      }

      heading.textContent = "Current Vehicles";
      summary.textContent = `${visibleVehicles.length} vehicle${visibleVehicles.length === 1 ? "" : "s"} currently featured.`;
      grid.innerHTML = visibleVehicles.map(vehicleCard).join("");
    } catch (error) {
      heading.textContent = "Vehicles Coming Soon";
      summary.textContent = "Call for current inventory and pricing.";
      grid.innerHTML = `
        <div class="inventory-empty">
          <strong>Inventory unavailable</strong>
          <span>Please call 501-272-9414 for current availability.</span>
        </div>
      `;
      console.error(error);
    }
  }

  loadVehicles();
})();
