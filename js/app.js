(() => {
  const form = document.getElementById("billOfSaleForm");
  const status = document.getElementById("saveStatus");
  const storageKey = "noBoundsAutoBillOfSaleDraftV2";

  if (!form) return;

  function showStatus(message) {
    if (!status) return;
    status.textContent = message;
    clearTimeout(showStatus.timer);
    showStatus.timer = setTimeout(() => {
      status.textContent = "";
    }, 3500);
  }

  function normalizeVin(input) {
    input.value = input.value
      .toUpperCase()
      .replace(/[^A-HJ-NPR-Z0-9]/g, "")
      .slice(0, 17);
  }

  function normalizeMoney(value) {
    const cleaned = String(value || "")
      .replace(/[$,\s]/g, "");

    if (cleaned === "") return "";

    const number = Number(cleaned);

    if (!Number.isFinite(number)) return "";

    return number.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function syncRepeatedFields() {
    const buyerName = form.elements.buyerName?.value || "";

    if (form.elements.buyerPrintedName) {
      form.elements.buyerPrintedName.value = buyerName;
    }
  }

  function formToObject() {
    const data = {};

    new FormData(form).forEach((value, key) => {
      data[key] = value;
    });

    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      data[checkbox.name] = checkbox.checked;
    });

    return data;
  }

  function objectToForm(data) {
    if (!data || typeof data !== "object") return;

    Object.entries(data).forEach(([name, value]) => {
      const element = form.elements[name];

      if (!element) return;

      if (element.type === "checkbox") {
        element.checked = Boolean(value);
      } else {
        element.value = value ?? "";
      }
    });

    syncRepeatedFields();
  }

  function saveDraft() {
    const payload = {
      savedAt: new Date().toISOString(),
      values: formToObject()
    };

    localStorage.setItem(storageKey, JSON.stringify(payload));

    showStatus(
      `Draft saved locally at ${new Date().toLocaleTimeString()}.`
    );
  }

  function loadDraft() {
    const raw = localStorage.getItem(storageKey);

    if (!raw) {
      showStatus("No saved Bill of Sale draft was found in this browser.");
      return;
    }

    try {
      const payload = JSON.parse(raw);

      objectToForm(payload.values);

      showStatus(
        `Draft loaded from ${new Date(payload.savedAt).toLocaleString()}.`
      );
    } catch (error) {
      console.error(error);
      showStatus("The saved draft could not be read.");
    }
  }

  function clearForm() {
    const confirmed = confirm(
      "Clear the buyer and vehicle information and start a new Bill of Sale?"
    );

    if (!confirmed) return;

    form.reset();

    if (form.elements.saleDate) {
      form.elements.saleDate.value =
        new Date().toISOString().slice(0, 10);
    }

    if (form.elements.buyerStateZip) {
      form.elements.buyerStateZip.value = "AR ";
    }

    if (form.elements.buyerPrintedName) {
      form.elements.buyerPrintedName.value = "";
    }

    showStatus("New blank Bill of Sale started.");
  }

  form.addEventListener("input", (event) => {
    const target = event.target;

    if (target.name === "vin") {
      normalizeVin(target);
    }

    if (target.name === "buyerName") {
      syncRepeatedFields();
    }
  });

  if (form.elements.cashPrice) {
    form.elements.cashPrice.addEventListener("blur", (event) => {
      event.target.value = normalizeMoney(event.target.value);
    });
  }

  document
    .getElementById("saveDraft")
    ?.addEventListener("click", saveDraft);

  document
    .getElementById("loadDraft")
    ?.addEventListener("click", loadDraft);

  document
    .getElementById("newForm")
    ?.addEventListener("click", clearForm);

  const yearElement = document.getElementById("year");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  if (form.elements.saleDate && !form.elements.saleDate.value) {
    form.elements.saleDate.value =
      new Date().toISOString().slice(0, 10);
  }
})();
