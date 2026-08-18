(() => {
  const form = document.getElementById("billOfSaleForm");
  const status = document.getElementById("saveStatus");
  const generateButton = document.getElementById("generatePdf");
  const storageKey = "noBoundsAutoBillOfSaleDraftV2";
  const templateUrl = "pdf/Dealer-Filled.pdf";

  const moneyFields = [
    "cashPrice", "taxCollected", "tradeAllowance", "serviceFee",
    "tradePayoff", "governmentFees", "downPayment", "otherCharge"
  ];

  function rawMoneyValue(name) {
    return String(form.elements[name]?.value ?? "").trim();
  }

  function numberValue(name) {
    const raw = rawMoneyValue(name);
    if (!raw || /^n\/?a$/i.test(raw)) return 0;
    const cleaned = raw.replace(/[$,\s]/g, "");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function hasNumericMoney(name) {
    const raw = rawMoneyValue(name);
    if (!raw || /^n\/?a$/i.test(raw)) return false;
    const cleaned = raw.replace(/[$,\s]/g, "");
    return cleaned !== "" && Number.isFinite(Number(cleaned));
  }

  function formatMoney(n) {
    return n.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function recalculate() {
    const calculationFields = [
      "cashPrice", "taxCollected", "serviceFee", "governmentFees",
      "otherCharge", "tradeAllowance", "tradePayoff", "downPayment"
    ];

    const hasAnyNumber = calculationFields.some(hasNumericMoney);

    // During negotiation, leave calculated totals blank until at least one
    // numeric amount has actually been entered.
    if (!hasAnyNumber) {
      form.elements.totalPurchasePrice.value = "";
      form.elements.unpaidBalance.value = "";
      return;
    }

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

  function showStatus(message, persistent = false) {
    status.textContent = message;
    clearTimeout(showStatus.timer);
    if (!persistent) {
      showStatus.timer = setTimeout(() => status.textContent = "", 5000);
    }
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
    const raw = localStorage.getItem(storageKey) || localStorage.getItem("noBoundsAutoBillOfSaleDraftV1");
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
      sellerPrintedName: form.elements.sellerPrintedName.value,
      sellerInitials: form.elements.sellerInitials?.value || ""
    };
    form.reset();
    Object.entries(preserved).forEach(([k, v]) => {
      if (form.elements[k]) form.elements[k].value = v;
    });
    form.elements.saleDate.value = new Date().toISOString().slice(0, 10);
    form.elements.titleState.value = "AR";
    moneyFields.forEach(name => form.elements[name].value = "");
    recalculate();
    showStatus("New blank agreement started.");
  }

  function syncRepeatedFields() {
    form.elements.buyerPrintedName.value = form.elements.buyerName.value;
    form.elements.signatureBuyerLicense.value = form.elements.buyerLicense.value;
    form.elements.signatureDealerLicense.value = form.elements.dealerLicense.value;
  }

  function value(name) {
    return String(form.elements[name]?.value || "").trim();
  }

  function checked(name) {
    return Boolean(form.elements[name]?.checked);
  }

  function pdfDate(dateString) {
    if (!dateString) return "";
    const parts = dateString.split("-");
    if (parts.length !== 3) return dateString;
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }

  function pdfDateTime(dateTimeString) {
    if (!dateTimeString) return "";
    const d = new Date(dateTimeString);
    if (Number.isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleString("en-US", {
      month: "2-digit", day: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  }

  function sanitizeFilename(text) {
    return String(text || "")
      .replace(/[^a-z0-9_-]+/gi, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 90);
  }

  async function generatePdf() {
    syncRepeatedFields();
    recalculate();

    if (!window.PDFLib) {
      showStatus("PDF library did not load. Check your internet connection and refresh the page.", true);
      return;
    }

    const vin = value("vin");
    if (vin && vin.length !== 17) {
      if (!confirm(`The VIN currently has ${vin.length} characters instead of 17. Generate the PDF anyway?`)) return;
    }

    const required = ["buyerName", "vehicleYear", "vehicleMake", "vehicleModel", "vin"];
    const missing = required.filter(name => !value(name));
    if (missing.length) {
      const labels = {
        buyerName: "Buyer Name", vehicleYear: "Vehicle Year", vehicleMake: "Vehicle Make",
        vehicleModel: "Vehicle Model", vin: "VIN"
      };
      if (!confirm(`These fields are blank: ${missing.map(x => labels[x]).join(", ")}. Generate the PDF anyway?`)) return;
    }

    generateButton.disabled = true;
    generateButton.classList.add("is-working");
    showStatus("Generating clean PDF…", true);

    try {
      const { PDFDocument, StandardFonts, rgb } = PDFLib;
      const response = await fetch(templateUrl, { cache: "no-store" });
      if (!response.ok) throw new Error(`Could not load PDF template (${response.status}).`);

      const templateBytes = await response.arrayBuffer();
      const pdfDoc = await PDFDocument.load(templateBytes);
      const pages = pdfDoc.getPages();
      if (pages.length < 2) throw new Error("The PDF template must contain two pages.");

      const page1 = pages[0];
      const page2 = pages[1];
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const black = rgb(0, 0, 0);
      const white = rgb(1, 1, 1);

      function drawTop(page, x, topY, text, size = 8, maxChars = null, useBold = false) {
        let t = String(text ?? "").trim();
        if (!t) return;
        if (maxChars && t.length > maxChars) t = t.slice(0, maxChars);
        const { height } = page.getSize();
        page.drawText(t, {
          x,
          y: height - topY,
          size,
          font: useBold ? bold : font,
          color: black
        });
      }

      function checkboxTop(page, x, topY, isChecked) {
        const { height } = page.getSize();
        const bottom = height - topY + 0.5;
        page.drawRectangle({ x: x - 0.6, y: bottom - 0.6, width: 7.1, height: 7.3, color: white, borderColor: white });
        page.drawRectangle({ x, y: bottom, width: 5.7, height: 5.7, borderColor: black, borderWidth: 0.6 });
        if (isChecked) {
          page.drawText("X", { x: x + 0.7, y: bottom + 0.4, size: 6.2, font: bold, color: black });
        }
      }

      function cleanMoney(name) {
        const raw = rawMoneyValue(name);
        if (!raw) return "";
        if (/^n\/?a$/i.test(raw)) return "N/A";

        const cleaned = raw.replace(/[$,\s]/g, "");
        const n = Number(cleaned);
        return Number.isFinite(n) ? formatMoney(n) : raw;
      }

      // Reprint the dealer metadata line so the website values control the generated PDF.
      page1.drawRectangle({ x: 64, y: 723, width: 490, height: 16, color: white });
      const dealerMeta = `Dealer Address: ${value("dealerAddress")}   Arkansas Dealer License No.: ${value("dealerLicense")}   Phone: ${value("dealerPhone")}`;
      drawTop(page1, 77, 64, dealerMeta, 6.5, 120);

      // PAGE 1: contract/sale information.
      drawTop(page1, 176, 80, value("contractNumber"), 8, 24);
      drawTop(page1, 442, 80, pdfDate(value("saleDate")), 8, 16);
      drawTop(page1, 176, 94, value("stockNumber"), 8, 24);
      drawTop(page1, 442, 94, pdfDateTime(value("deliveryDateTime")), 7.2, 24);

      // Buyer information.
      drawTop(page1, 116, 123, value("buyerName"), 8, 36);
      drawTop(page1, 350, 127, value("coBuyerName"), 8, 30);
      drawTop(page1, 90, 145, value("buyerAddress"), 8, 42);
      drawTop(page1, 350, 149, value("buyerCityStateZip"), 8, 30);
      drawTop(page1, 120, 167, value("buyerLicense"), 8, 34);
      drawTop(page1, 350, 171, value("buyerContact"), 7.2, 34);

      // Vehicle information.
      drawTop(page1, 35, 219, value("vehicleYear"), 8, 4);
      drawTop(page1, 170, 219, value("vehicleMake"), 8, 20);
      drawTop(page1, 303, 219, value("vehicleModel"), 8, 22);
      drawTop(page1, 436, 219, value("vehicleColor"), 8, 18);
      drawTop(page1, 155, 233, value("vin"), 8, 17);
      drawTop(page1, 485, 233, value("licensePlate"), 8, 15);
      drawTop(page1, 69, 264, value("odometer"), 8, 16);
      drawTop(page1, 205, 264, value("titleState"), 8, 13);
      drawTop(page1, 332, 264, value("titleNumber"), 8, 17);
      drawTop(page1, 457, 269, value("otherTitleDescription"), 7.2, 16);

      checkboxTop(page1, 167.0, 246.5, value("odometerStatus") === "Actual Mileage");
      checkboxTop(page1, 300.2, 246.5, value("odometerStatus") === "Exceeds Mechanical Limits");
      checkboxTop(page1, 433.4, 246.5, value("odometerStatus") === "Not Actual - WARNING");

      checkboxTop(page1, 433.4, 260.4, value("titleStatus") === "Clean");
      checkboxTop(page1, 464.9, 260.4, value("titleStatus") === "Salvage");
      checkboxTop(page1, 503.9, 260.4, value("titleStatus") === "Rebuilt");
      checkboxTop(page1, 539.2, 260.4, value("titleStatus") === "Other");

      // Purchase price/payment.
      drawTop(page1, 177, 319, cleanMoney("cashPrice"), 8);
      drawTop(page1, 440, 319, cleanMoney("taxCollected"), 8);
      drawTop(page1, 177, 341, cleanMoney("tradeAllowance"), 8);
      drawTop(page1, 440, 341, cleanMoney("serviceFee"), 8);
      drawTop(page1, 177, 359, cleanMoney("tradePayoff"), 8);
      drawTop(page1, 440, 359, cleanMoney("governmentFees"), 8);
      drawTop(page1, 177, 378, cleanMoney("downPayment"), 8);
      drawTop(page1, 440, 378, cleanMoney("otherCharge"), 8);
      drawTop(page1, 177, 396, value("unpaidBalance"), 8);
      drawTop(page1, 440, 396, value("totalPurchasePrice"), 8, null, true);
      drawTop(page1, 380, 378, value("otherChargeDescription"), 6.2, 18);
      drawTop(page1, 122, 416, value("receiptNumber"), 7.2, 25);

      // The template is intentionally cash-marked. Add a short printed payment method note for clarity.
      if (value("paymentMethod") && value("paymentMethod") !== "Cash") {
        drawTop(page1, 305, 416, `Selected: ${value("paymentMethod")}`, 6.5, 34);
      }

      // Trade-in.
      drawTop(page1, 96, 443, value("tradeVehicle"), 7.2, 22);
      drawTop(page1, 228, 447, value("tradeVin"), 7.2, 17);
      drawTop(page1, 448, 447, value("tradeOdometer"), 7.2, 12);
      drawTop(page1, 86, 465, value("tradeTitle"), 7.2, 20);
      drawTop(page1, 250, 469, value("tradeLienholder"), 7.2, 22);
      drawTop(page1, 465, 469, pdfDate(value("tradePayoffDate")), 7.2, 16);

      // PAGE 2: buyer initials on every acknowledgment line.
      const buyerInitials = value("buyerInitials");
      const initialSpots = [
        [564,56], [442,85], [553,123], [333,161], [224,190],
        [63,220], [296,240], [150,270], [87,299], [404,319],
        [110,349], [242,369], [557,389]
      ];
      initialSpots.forEach(([x,y]) => drawTop(page2, x, y, buyerInitials, 7.2, 5, true));
      drawTop(page2, 86, 465, buyerInitials, 7.2, 5, true);

      // Documents delivered/received.
      const docs = {
        docBuyersGuide: [216, 497],
        docBillOfSale: [303, 497],
        docTitle: [355, 497],
        docOdometer: [431, 497],
        docTempTag: [527, 497],
        docFinance: [84, 509],
        docBrandedTitle: [164, 509],
        docDueBill: [293, 509]
      };
      Object.entries(docs).forEach(([name, [x,y]]) => checkboxTop(page2, x, y, checked(name)));

      // Typed signature-section information. Physical signature lines remain blank.
      drawTop(page2, 91, 595, value("buyerPrintedName") || value("buyerName"), 7.2, 34);
      drawTop(page2, 350, 595, value("signatureBuyerLicense") || value("buyerLicense"), 7.2, 25);
      drawTop(page2, 130, 637, value("sellerPrintedName"), 7.2, 30);
      drawTop(page2, 395, 637, value("signatureDealerLicense") || value("dealerLicense"), 7.2, 18);
      drawTop(page2, 399, 649, buyerInitials, 7.2, 5, true);
      drawTop(page2, 484, 649, value("sellerInitials"), 7.2, 5, true);

      pdfDoc.setTitle(`No Bounds Auto Bill of Sale - ${value("vehicleYear")} ${value("vehicleMake")} ${value("vehicleModel")}`);
      pdfDoc.setAuthor("No Bounds Auto");
      pdfDoc.setCreator("No Bounds Auto website");

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const popup = window.open(url, "_blank");
      if (!popup) {
        const a = document.createElement("a");
        const name = sanitizeFilename(`${value("vehicleYear")}_${value("vehicleMake")}_${value("vehicleModel")}_${value("buyerName")}`) || "NoBoundsAuto_BillOfSale";
        a.href = url;
        a.download = `${name}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showStatus("PDF generated and downloaded. Open it to print.");
      } else {
        showStatus("PDF generated. Use the PDF viewer's Print button in the new tab.");
      }

      setTimeout(() => URL.revokeObjectURL(url), 120000);
    } catch (error) {
      console.error(error);
      showStatus(`PDF generation failed: ${error.message}`, true);
      alert(`Could not generate the PDF.\n\n${error.message}`);
    } finally {
      generateButton.disabled = false;
      generateButton.classList.remove("is-working");
    }
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
      const raw = String(event.target.value || "").trim();

      if (!raw) {
        event.target.value = "";
      } else if (/^n\/?a$/i.test(raw)) {
        event.target.value = "N/A";
      } else {
        const cleaned = raw.replace(/[$,\s]/g, "");
        const n = Number(cleaned);
        if (Number.isFinite(n)) {
          event.target.value = formatMoney(n);
        }
      }

      recalculate();
    });
  });

  document.getElementById("saveDraft").addEventListener("click", saveDraft);
  document.getElementById("loadDraft").addEventListener("click", loadDraft);
  document.getElementById("newForm").addEventListener("click", clearForm);
  generateButton.addEventListener("click", generatePdf);

  document.getElementById("year").textContent = new Date().getFullYear();

  if (!form.elements.saleDate.value) {
    form.elements.saleDate.value = new Date().toISOString().slice(0, 10);
  }
  if (!form.elements.dealerLicense.value) {
    form.elements.dealerLicense.value = "M 13668";
  }
  if (!form.elements.deliveryDateTime.value) {
    const now = new Date();
    const offset = now.getTimezoneOffset();
    const local = new Date(now.getTime() - offset * 60000).toISOString().slice(0,16);
    form.elements.deliveryDateTime.value = local;
  }
  recalculate();
  syncRepeatedFields();
})();
