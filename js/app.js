(() => {
  const form = document.getElementById("billOfSaleForm");
  const status = document.getElementById("saveStatus");
  const storageKey = "noBoundsAutoBillOfSaleDraftV1";

  const moneyFields = [
    "cashPrice", "taxCollected", "tradeAllowance", "serviceFee",
    "tradePayoff", "governmentFees", "downPayment", "otherCharge"
  ];

  function numberValue(name) {
    const el = form.elements[name];
    const cleaned = String(el?.value || "0").replace(/[$,\s]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function formatMoney(n) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function recalculate() {
    const cashPrice = numberValue("cashPrice");
    const tax = numberValue("taxCollected");
    const serviceFee = numberValue("serviceFee");
    const governmentFees = numberValue("governmentFees");
    const otherCharge = numberValue("otherCharge");
    const tradeAllowance = numberValue("tradeAllowance");
    const tradePayoff = numberValue("tradePayoff");
    const downPayment = numberValue("downPayment");

    const total = cashPrice + tax + serviceFee + governmentFees + otherCharge;
    const netTradeCredit = tradeAllowance - tradePayoff;
    const unpaid = Math.max(0, total - netTradeCredit - downPayment);

    form.elements.totalPurchasePrice.value = formatMoney(total);
    form.elements.unpaidBalance.value = formatMoney(unpaid);
  }

  function formToObject() {
    const data = {};
    new FormData(form).forEach((value, key) => {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
      } else {
        data[key] = value;
      }
    });

    form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
      data[checkbox.name] = checkbox.checked;
    });
    return data;
  }

  function objectToForm(data) {
    if (!data || typeof data !== "object") return;
    Object.entries(data).forEach(([name, value]) => {
      const el = form.elements[name];
      if (!el) return;
      if (el.type === "checkbox") {
        el.checked = Boolean(value);
      } else {
        el.value = value ?? "";
      }
    });
    recalculate();
    syncRepeatedFields();
  }

  function showStatus(message) {
    status.textContent = message;
    clearTimeout(showStatus.timer);
    showStatus.timer = setTimeout(() => status.textContent = "", 3500);
  }

  function saveDraft() {
    const payload = {
      savedAt: new Date().toISOString(),
      values: formToObject()
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    showStatus(`Draft saved locally at ${new Date().toLocaleTimeString()}.`);
  }

  function loadDraft() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      showStatus("No saved draft was found in this browser.");
      return;
    }
    try {
      const payload = JSON.parse(raw);
      objectToForm(payload.values);
      showStatus(`Draft loaded from ${new Date(payload.savedAt).toLocaleString()}.`);
    } catch {
      showStatus("The saved draft could not be read.");
    }
  }

  function clearForm() {
    if (!confirm("Clear all customer and vehicle information and start a new form?")) return;
    const preserved = {
      dealerAddress: form.elements.dealerAddress.value,
      dealerLicense: form.elements.dealerLicense.value,
      dealerPhone: form.elements.dealerPhone.value,
      sellerPrintedName: form.elements.sellerPrintedName.value
    };
    form.reset();
    Object.entries(preserved).forEach(([k, v]) => form.elements[k].value = v);
    form.elements.saleDate.value = new Date().toISOString().slice(0, 10);
    moneyFields.forEach(name => form.elements[name].value = "0.00");
    recalculate();
    showStatus("New blank agreement started.");
  }

  function syncRepeatedFields() {
    form.elements.buyerPrintedName.value = form.elements.buyerName.value;
    form.elements.signatureBuyerLicense.value = form.elements.buyerLicense.value;
    form.elements.signatureDealerLicense.value = form.elements.dealerLicense.value;
  }

  form.addEventListener("input", (event) => {
    if (event.target.classList.contains("money")) recalculate();
    if (event.target.name === "vin" || event.target.name === "tradeVin") {
      event.target.value = event.target.value.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, "").slice(0, 17);
    }
    if (["buyerName", "buyerLicense", "dealerLicense"].includes(event.target.name)) {
      syncRepeatedFields();
    }
  });

  moneyFields.forEach(name => {
    form.elements[name].addEventListener("blur", (event) => {
      event.target.value = formatMoney(numberValue(name));
      recalculate();
    });
  });

  document.getElementById("saveDraft").addEventListener("click", saveDraft);
  document.getElementById("loadDraft").addEventListener("click", loadDraft);
  document.getElementById("newForm").addEventListener("click", clearForm);
  document.getElementById("printForm").addEventListener("click", () => {
    syncRepeatedFields();
    recalculate();
    window.print();
  });

  document.getElementById("year").textContent = new Date().getFullYear();

  if (!form.elements.saleDate.value) {
    form.elements.saleDate.value = new Date().toISOString().slice(0, 10);
  }
  recalculate();
})();
