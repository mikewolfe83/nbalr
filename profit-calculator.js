const inputs = {
  purchase: document.getElementById("purchasePrice"),
  repairs: document.getElementById("repairExpenses"),
  desiredProfit: document.getElementById("desiredProfit"),
  federalRate: document.getElementById("federalRate"),
  arkansasRate: document.getElementById("arkansasRate"),
  localSalesTaxRate: document.getElementById("localSalesTaxRate"),
  includeSE: document.getElementById("includeSelfEmployment")
};

const outputs = {
  sellingPrice: document.getElementById("sellingPrice"),
  purchase: document.getElementById("purchaseOutput"),
  repairs: document.getElementById("repairsOutput"),
  investment: document.getElementById("investmentOutput"),
  profitBeforeTax: document.getElementById("profitBeforeTax"),
  stateSalesTax: document.getElementById("stateSalesTax"),
  localSalesTax: document.getElementById("localSalesTax"),
  totalSalesTax: document.getElementById("totalSalesTax"),
  buyerTotal: document.getElementById("buyerTotal"),
  federalTax: document.getElementById("federalTax"),
  arkansasTax: document.getElementById("arkansasTax"),
  selfEmploymentTax: document.getElementById("selfEmploymentTax"),
  selfEmploymentRow: document.getElementById("selfEmploymentRow"),
  totalIncomeTax: document.getElementById("totalIncomeTax"),
  profitAfterTax: document.getElementById("profitAfterTax"),
  preTaxMargin: document.getElementById("preTaxMargin"),
  afterTaxMargin: document.getElementById("afterTaxMargin")
};

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD"
});

function amount(field) {
  const value = Number.parseFloat(field.value);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function rate(field) {
  return amount(field) / 100;
}

function margin(part, total) {
  return total > 0 ? `${((part / total) * 100).toFixed(1)}%` : "0.0%";
}

function getArkansasVehicleStateTax(sellingPrice) {
  if (sellingPrice < 4000) return 0;
  if (sellingPrice < 10000) return sellingPrice * 0.035;
  return sellingPrice * 0.065;
}

function calculate() {
  const purchase = amount(inputs.purchase);
  const repairs = amount(inputs.repairs);
  const desiredProfit = amount(inputs.desiredProfit);
  const investment = purchase + repairs;
  const sellingPrice = investment + desiredProfit;

  // Arkansas buyer-side motor vehicle sales tax estimate.
  const stateVehicleTax = getArkansasVehicleStateTax(sellingPrice);
  const localVehicleTax = sellingPrice * rate(inputs.localSalesTaxRate);
  const totalVehicleTax = stateVehicleTax + localVehicleTax;
  const buyerTotal = sellingPrice + totalVehicleTax;

  // Business income-tax planning estimates applied to profit.
  const federalIncomeTax = desiredProfit * rate(inputs.federalRate);
  const arkansasIncomeTax = desiredProfit * rate(inputs.arkansasRate);
  const selfEmploymentTax = inputs.includeSE.checked
    ? desiredProfit * 0.9235 * 0.153
    : 0;

  const totalIncomeTax = federalIncomeTax + arkansasIncomeTax + selfEmploymentTax;
  const profitAfterTax = desiredProfit - totalIncomeTax;

  outputs.sellingPrice.textContent = money.format(sellingPrice);
  outputs.purchase.textContent = money.format(purchase);
  outputs.repairs.textContent = money.format(repairs);
  outputs.investment.textContent = money.format(investment);
  outputs.profitBeforeTax.textContent = money.format(desiredProfit);

  outputs.stateSalesTax.textContent = money.format(stateVehicleTax);
  outputs.localSalesTax.textContent = money.format(localVehicleTax);
  outputs.totalSalesTax.textContent = money.format(totalVehicleTax);
  outputs.buyerTotal.textContent = money.format(buyerTotal);

  outputs.federalTax.textContent = money.format(federalIncomeTax);
  outputs.arkansasTax.textContent = money.format(arkansasIncomeTax);
  outputs.selfEmploymentTax.textContent = money.format(selfEmploymentTax);
  outputs.selfEmploymentRow.hidden = !inputs.includeSE.checked;
  outputs.totalIncomeTax.textContent = money.format(totalIncomeTax);
  outputs.profitAfterTax.textContent = money.format(profitAfterTax);

  outputs.preTaxMargin.textContent = margin(desiredProfit, sellingPrice);
  outputs.afterTaxMargin.textContent = margin(profitAfterTax, sellingPrice);
}

Object.values(inputs).forEach((input) => {
  input.addEventListener("input", calculate);
  input.addEventListener("change", calculate);
});

document.getElementById("resetButton").addEventListener("click", () => {
  inputs.purchase.value = "1000";
  inputs.repairs.value = "500";
  inputs.desiredProfit.value = "1500";
  inputs.federalRate.value = "22";
  inputs.arkansasRate.value = "3.9";
  inputs.localSalesTaxRate.value = "0";
  inputs.includeSE.checked = false;
  calculate();
});

document.getElementById("printButton").addEventListener("click", () => window.print());

const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector(".nav-links");

menuButton.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  menuButton.setAttribute("aria-expanded", String(open));
});

document.getElementById("year").textContent = new Date().getFullYear();
calculate();
