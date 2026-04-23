let financeData = JSON.parse(localStorage.getItem("brokerFinance")) || [];
let viewDate = new Date(); // Mês que o usuário está vendo agora
let editIndex = null;

const init = () => {
  updateDisplay();
  document.getElementById("date").valueAsDate = new Date();
};

const updateDisplay = () => {
  const monthYear = viewDate.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  document.getElementById("current-month-display").innerText = monthYear;
  render();
};

window.changeMonth = (diff) => {
  viewDate.setMonth(viewDate.getMonth() + diff);
  updateDisplay();
};

const render = () => {
  const container = document.getElementById("finance-container");
  const totalDisplay = document.getElementById("month-total");
  container.innerHTML = "";
  let totalMês = 0;

  const vMonth = viewDate.getMonth();
  const vYear = viewDate.getFullYear();

  // Filtra apenas o que pertence ao mês/ano da visualização atual
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

  // Se o mês estiver vazio, oferece importar recorrentes
  if (filteredItems.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:40px; opacity:0.5">
            <p>Nenhum lançamento para este mês.</p>
            <button onclick="copyRecurrent()" style="background:var(--primary); border:none; color:white; padding:10px 20px; border-radius:5px">
                Importar Contas Fixas
            </button>
        </div>`;
  }

  filteredItems.forEach((item) => {
    const originalIndex = financeData.indexOf(item);
    const valor = parseFloat(item.amount) || 0;
    totalMês += valor;

    // Lógica de cores da imagem: Se tiver "cartão" ou "visa" ou "master" fica preto
    const isCard = /cartão|visa|master/i.test(item.title);

    const card = document.createElement("article");
    card.className = `event-card ${item.status} ${isCard ? "is-card" : ""}`;

    card.innerHTML = `
            <div>
                <small style="color: #94a3b8">DIA ${new Date(item.date + "T00:00:00").getDate().toString().padStart(2, "0")}</small>
                <strong style="display: block; text-transform: uppercase; font-size: 0.85rem">${item.title}</strong>
                <span class="status-tag ${item.status === "pago" ? "tag-pg" : "tag-wait"}">
                    ${item.status === "pago" ? "PG" : "PENDENTE"}
                </span>
            </div>
            <div style="text-align: right">
                <div class="amount-display">R$ ${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</div>
                <div class="card-actions" style="margin-top: 5px">
                    <button class="btn-icon" onclick="toggleStatus(${originalIndex})"><i data-lucide="check"></i></button>
                    <button class="btn-icon" onclick="handleEdit(${originalIndex})"><i data-lucide="pencil"></i></button>
                    <button class="btn-icon" onclick="handleDelete(${originalIndex})"><i data-lucide="trash"></i></button>
                </div>
            </div>
        `;
    container.appendChild(card);
  });

  totalDisplay.innerText = `R$ ${totalMês.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  if (window.lucide) lucide.createIcons();
};

// MÁGICA: Pega tudo que é recorrente e joga para o mês que o pai está vendo
window.copyRecurrent = () => {
  const recurrents = financeData.filter((item) => item.isRecurring);

  // Evita duplicatas: remove o que já existir de recorrente no mês destino antes de copiar
  const newItems = recurrents.map((item) => {
    const newDate = new Date(
      viewDate.getFullYear(),
      viewDate.getMonth(),
      new Date(item.date + "T00:00:00").getDate(),
    );
    return {
      ...item,
      status: "pendente", // Sempre começa pendente no mês novo
      date: newDate.toISOString().split("T")[0],
    };
  });

  financeData.push(...newItems);
  save();
};

document.getElementById("finance-form").onsubmit = (e) => {
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

  save();
  e.target.reset();
  document.getElementById("date").valueAsDate = new Date();
};

window.toggleStatus = (index) => {
  financeData[index].status =
    financeData[index].status === "pago" ? "pendente" : "pago";
  save();
};

window.handleEdit = (index) => {
  const item = financeData[index];
  document.getElementById("title").value = item.title;
  document.getElementById("amount").value = item.amount;
  document.getElementById("date").value = item.date;
  document.getElementById("status").value = item.status;
  document.getElementById("is-recurring").checked = item.isRecurring;
  editIndex = index;
  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.handleDelete = (index) => {
  if (confirm("Excluir?")) {
    financeData.splice(index, 1);
    save();
  }
};

const save = () => {
  localStorage.setItem("brokerFinance", JSON.stringify(financeData));
  render();
};

init();
