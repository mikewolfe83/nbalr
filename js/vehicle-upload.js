(() => {
  const form = document.getElementById("vehicleUploadForm");
  const preview = document.getElementById("imagePreview");
  const imageInput = document.getElementById("vehicleImage");
  const list = document.getElementById("adminVehicleList");
  const status = document.getElementById("adminStatus");
  const exportButton = document.getElementById("exportVehicles");
  const reloadButton = document.getElementById("reloadInventory");
  const clearButton = document.getElementById("clearWorkingList");

  let workingVehicles = [];
  let encodedImage = "";

  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  });

  function showStatus(message) {
    status.textContent = message;
    clearTimeout(showStatus.timer);
    showStatus.timer = setTimeout(() => {
      status.textContent = "";
    }, 5000);
  }

  async function loadCurrentInventory() {
    try {
      const response = await fetch(`data/vehicles.json?v=${Date.now()}`, { cache: "no-store" });
      if (!response.ok) throw new Error();
      const data = await response.json();
      workingVehicles = Array.isArray(data) ? data : [];
      renderList();
      showStatus(`Loaded ${workingVehicles.length} vehicle${workingVehicles.length === 1 ? "" : "s"} from the live inventory file.`);
    } catch {
      workingVehicles = [];
      renderList();
      showStatus("Could not load the current vehicles.json file. Starting with an empty working list.");
    }
  }

  function renderList() {
    if (!workingVehicles.length) {
      list.innerHTML = `<div class="empty-admin-list">No vehicles in the working inventory yet.</div>`;
      return;
    }

    list.innerHTML = workingVehicles.map((vehicle, index) => {
      const title = [vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "Vehicle";
      const image = vehicle.image
        ? `<img src="${vehicle.image}" alt="">`
        : `<div></div>`;

      return `
        <article class="admin-vehicle-item">
          ${image}
          <div>
            <h3>${escapeHtml(title)}</h3>
            <p>${money.format(Number(vehicle.price) || 0)} • ${escapeHtml(vehicle.status || "Available")}</p>
          </div>
          <button class="remove-vehicle" type="button" data-index="${index}">Remove</button>
        </article>
      `;
    }).join("");

    list.querySelectorAll(".remove-vehicle").forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        workingVehicles.splice(index, 1);
        renderList();
        showStatus("Vehicle removed from the working inventory.");
      });
    });
  }

  function escapeHtml(value = "") {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function resizeImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const maxWidth = 1200;
          const scale = Math.min(1, maxWidth / image.width);
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(image.width * scale);
          canvas.height = Math.round(image.height * scale);

          const context = canvas.getContext("2d");
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };

        image.onerror = reject;
        image.src = reader.result;
      };

      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  imageInput.addEventListener("change", async () => {
    const file = imageInput.files?.[0];
    if (!file) {
      encodedImage = "";
      preview.innerHTML = "<span>Vehicle image preview</span>";
      return;
    }

    if (!file.type.startsWith("image/")) {
      showStatus("Please choose an image file.");
      imageInput.value = "";
      return;
    }

    try {
      encodedImage = await resizeImage(file);
      preview.innerHTML = `<img src="${encodedImage}" alt="Vehicle preview">`;
      showStatus("Image loaded and resized for the website.");
    } catch {
      showStatus("The image could not be processed.");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const vehicle = {
      id: `vehicle-${Date.now()}`,
      year: data.get("year")?.trim() || "",
      make: data.get("make")?.trim() || "",
      model: data.get("model")?.trim() || "",
      price: Number(data.get("price")) || 0,
      mileage: Number(data.get("mileage")) || 0,
      stockNumber: data.get("stockNumber")?.trim() || "",
      status: data.get("status")?.trim() || "Available",
      description: data.get("description")?.trim() || "",
      image: encodedImage
    };

    if (!vehicle.price) {
      showStatus("Enter a vehicle price before adding the vehicle.");
      return;
    }

    workingVehicles.unshift(vehicle);

    // Homepage intentionally shows only the newest 9 vehicles in a 3 x 3 layout.
    renderList();
    form.reset();
    encodedImage = "";
    preview.innerHTML = "<span>Vehicle image preview</span>";
    showStatus("Vehicle added to the working inventory. Download vehicles.json when finished.");
  });

  exportButton.addEventListener("click", () => {
    const json = JSON.stringify(workingVehicles, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "vehicles.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showStatus("vehicles.json downloaded. Replace data/vehicles.json in GitHub with this file.");
  });

  reloadButton.addEventListener("click", loadCurrentInventory);

  clearButton.addEventListener("click", () => {
    if (!confirm("Clear the working inventory list? This does not change the live website until you upload a new vehicles.json file.")) return;
    workingVehicles = [];
    renderList();
    showStatus("Working inventory cleared.");
  });

  loadCurrentInventory();
})();
