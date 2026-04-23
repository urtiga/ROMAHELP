let financeData = JSON.parse(localStorage.getItem("brokerFinance")) || [];
let viewDate = new Date();
let editIndex = null;

const elements = {
  formContainer: document.getElementById("form-container"),
  formTitle: document.getElementById("form-title"),
  submitBtn: document.getElementById("submit-btn"),
  cancelBtn: document.getElementById("cancel-btn"),
  form: document.getElementById("finance-form"),
  importArea: document.getElementById("import-area"),
};

const init = () => {
  updateDisplay();
  document.getElementById("date").valueAsDate = viewDate;
};

const updateDisplay = () => {
  const monthName = viewDate.toLocaleDateString("pt-BR", { month: "long" });
  document.getElementById("dynamic-title").innerText =
    `Despesas de ${monthName}`;
  document.getElementById("year-label").innerText = viewDate.getFullYear();
  render();
};

window.changeMonth = (diff) => {
  viewDate.setMonth(viewDate.getMonth() + diff);
  resetForm();
  updateDisplay();
};

const render = () => {
  const container = document.getElementById("finance-container");
  const totalDisplay = document.getElementById("month-total");
  container.innerHTML = "";
  elements.importArea.innerHTML = "";
  let totalMês = 0;

  const vMonth = viewDate.getMonth();
  const vYear = viewDate.getFullYear();

  const filteredItems = financeData
    .filter((item) => {
      const d = new Date(item.date + "T00:00:00");
      return d.getMonth() === vMonth && d.getFullYear() === vYear;
    })
    .sort(
      (a, b) =>
        new Date(a.date + "T00:00:00").getDate() -
        new Date(b.date + "T00:00:00").getDate(),
    );

  if (filteredItems.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; border: 2px dashed #334155; border-radius:15px; opacity:0.6">
            <p>Nenhuma despesa lançada para este mês.</p>
        </div>`;
  }

  filteredItems.forEach((item) => {
    const idx = financeData.indexOf(item);
    const valor = parseFloat(item.amount) || 0;
    totalMês += valor;
    const isCard = /cartão|visa|master/i.test(item.title);

    const card = document.createElement("div");
    card.className = `item-card ${item.status} ${isCard ? "is-card" : ""}`;
    card.innerHTML = `
            <div class="item-info">
                <small>DIA ${new Date(item.date + "T00:00:00").getDate().toString().padStart(2, "0")}</small>
                <b>${item.title}</b>
                <div class="actions">
                    <button class="btn-sm" onclick="toggleStatus(${idx})" style="color: ${item.status === "pago" ? "var(--primary)" : "var(--warning)"}">
                        <i data-lucide="${item.status === "pago" ? "check-circle" : "circle"}"></i>
                    </button>
                    <button class="btn-sm" onclick="handleEdit(${idx})"><i data-lucide="pencil"></i></button>
                    <button class="btn-sm" onclick="handleDelete(${idx})" style="color:var(--danger)"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
            <div class="amount">
                R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                <div style="font-size: 10px; font-weight: bold; margin-top: 4px; color: ${item.status === "pago" ? "var(--primary)" : "var(--warning)"}">
                    ${item.status === "pago" ? "PAGO" : "PENDENTE"}
                </div>
            </div>
        `;
    container.appendChild(card);
  });

  // Botão de Importação sempre visível se houver recorrentes globais
  const hasRecurrents = financeData.some((item) => item.isRecurring);
  if (hasRecurrents) {
    elements.importArea.innerHTML = `
            <button onclick="copyRecurrent()" class="btn-import">
                <i data-lucide="copy-plus"></i> Importar Contas Fixas Mensais
            </button>
        `;
  }

  totalDisplay.innerText = `R$ ${totalMês.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  if (window.lucide) lucide.createIcons();
};

window.handleEdit = (i) => {
  const item = financeData[i];
  document.getElementById("title").value = item.title;
  document.getElementById("amount").value = item.amount;
  document.getElementById("date").value = item.date;
  document.getElementById("status").value = item.status;
  document.getElementById("is-recurring").checked = item.isRecurring;

  editIndex = i;
  elements.formContainer.classList.add("editing-mode");
  elements.formTitle.innerText = "⚠️ Editando Lançamento Existente";
  elements.submitBtn.innerText = "Salvar Alterações";
  elements.submitBtn.style.background = "var(--warning)";
  elements.submitBtn.style.color = "black";
  elements.cancelBtn.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.resetForm = () => {
  editIndex = null;
  elements.form.reset();
  document.getElementById("date").valueAsDate = viewDate;
  elements.formContainer.classList.remove("editing-mode");
  elements.formTitle.innerText = "Novo Lançamento";
  elements.submitBtn.innerText = "Adicionar Lançamento";
  elements.submitBtn.style.background = "var(--accent)";
  elements.submitBtn.style.color = "white";
  elements.cancelBtn.style.display = "none";
};

elements.form.onsubmit = (e) => {
  e.preventDefault();
  const newItem = {
    title: document.getElementById("title").value,
    amount: document.getElementById("amount").value,
    date: document.getElementById("date").value,
    status: document.getElementById("status").value,
    isRecurring: document.getElementById("is-recurring").checked,
  };

  if (editIndex !== null) financeData[editIndex] = newItem;
  else financeData.push(newItem);

  localStorage.setItem("brokerFinance", JSON.stringify(financeData));
  resetForm();
  render();
};

window.copyRecurrent = () => {
  const recurrents = financeData.filter((item) => item.isRecurring);
  const currentMonthTitles = financeData
    .filter((item) => {
      const d = new Date(item.date + "T00:00:00");
      return (
        d.getMonth() === viewDate.getMonth() &&
        d.getFullYear() === viewDate.getFullYear()
      );
    })
    .map((i) => i.title.toLowerCase());

  const toImport = recurrents.filter(
    (r) => !currentMonthTitles.includes(r.title.toLowerCase()),
  );

  if (toImport.length === 0) {
    alert("Todas as contas fixas já constam neste mês!");
    return;
  }

  toImport.forEach((item) => {
    const d = new Date(item.date + "T00:00:00");
    const newDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      d.getDate(),
    );
    financeData.push({
      ...item,
      status: "pendente",
      date: newDate.toISOString().split("T")[0],
    });
  });

  localStorage.setItem("brokerFinance", JSON.stringify(financeData));
  render();
};

window.toggleStatus = (i) => {
  financeData[i].status =
    financeData[i].status === "pago" ? "pendente" : "pago";
  localStorage.setItem("brokerFinance", JSON.stringify(financeData));
  render();
};

window.handleDelete = (i) => {
  if (confirm("Deseja apagar este item permanentemente?")) {
    financeData.splice(i, 1);
    localStorage.setItem("brokerFinance", JSON.stringify(financeData));
    render();
  }
};

init();
