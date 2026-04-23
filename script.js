let financeData = JSON.parse(localStorage.getItem("brokerFinance")) || [];
let viewDate = new Date();
let editIndex = null;

const updateDisplay = () => {
  document.getElementById("dynamic-title").innerText =
    viewDate.toLocaleDateString("pt-BR", { month: "long" });
  document.getElementById("year-label").innerText = viewDate.getFullYear();
  render();
};

const render = () => {
  const fixedContainer = document.getElementById("fixed-container");
  const eventualContainer = document.getElementById("eventual-container");
  const stats = { total: 0, paid: 0, pending: 0 };

  fixedContainer.innerHTML = "";
  eventualContainer.innerHTML = "";

  const filtered = financeData
    .filter((item) => {
      const d = new Date(item.date + "T00:00:00");
      return (
        d.getMonth() === viewDate.getMonth() &&
        d.getFullYear() === viewDate.getFullYear()
      );
    })
    .sort(
      (a, b) =>
        new Date(a.date + "T00:00:00").getDate() -
        new Date(b.date + "T00:00:00").getDate(),
    );

  filtered.forEach((item) => {
    const idx = financeData.indexOf(item);
    const valor = parseFloat(item.amount) || 0;

    stats.total += valor;
    item.status === "pago" ? (stats.paid += valor) : (stats.pending += valor);

    const card = createCard(item, idx);

    item.isRecurring
      ? fixedContainer.appendChild(card)
      : eventualContainer.appendChild(card);
  });

  document.getElementById("month-total").innerText =
    `R$ ${stats.total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("total-paid").innerText =
    `R$ ${stats.paid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
  document.getElementById("total-pending").innerText =
    `R$ ${stats.pending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const importArea = document.getElementById("import-area");

  let html = `
  <button onclick="exportData()" class="btn-import">💾 Exportar Dados</button>

  <input type="file" id="import-file" hidden onchange="importData(event)" />

  <button onclick="document.getElementById('import-file').click()" class="btn-import">
    📂 Importar Dados
  </button>
`;

  if (financeData.some((i) => i.isRecurring)) {
    html += `
    <button onclick="copyRecurrent()" class="btn-import">
      <i data-lucide="copy-plus"></i> Importar Contas Fixas Mensais
    </button>
  `;
  }

  importArea.innerHTML = html;

  if (window.lucide) lucide.createIcons();
};

const createCard = (item, idx) => {
  const itemDate = new Date(item.date + "T00:00:00");
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const isUrgent = item.status === "pendente" && itemDate <= hoje;

  const div = document.createElement("div");
  div.className = `item-card ${item.status} ${isUrgent ? "urgent" : ""}`;

  div.innerHTML = `
    <div class="item-info">
      <small style="color: var(--text-dim)">DIA ${itemDate
        .getDate()
        .toString()
        .padStart(2, "0")}</small>
      <br><b>${item.title}</b>

      <div class="actions" style="display: flex; gap: 8px; margin-top: 10px;">
        <button class="btn-sm btn-status ${item.status}" onclick="toggleStatus(${idx})">
          <i data-lucide="${
            item.status === "pago" ? "check-circle" : "circle"
          }"></i>
        </button>

        <button class="btn-sm btn-edit" onclick="handleEdit(${idx})">
          <i data-lucide="pencil"></i>
        </button>

        <button class="btn-sm btn-delete" onclick="handleDelete(${idx})">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    </div>

    <div style="text-align:right">
      <div style="font-size: 1.1rem; font-weight: 800;">
        R$ ${parseFloat(item.amount).toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
        })}
      </div>

      <div style="font-size: 10px; font-weight: bold; color: ${
        item.status === "pago" ? "var(--primary)" : "var(--warning)"
      }">
        ${
          isUrgent
            ? "🚨 VENCIDO/HOJE"
            : item.status === "pago"
              ? "PG OK"
              : "PENDENTE"
        }
      </div>
    </div>
  `;
  return div;
};

window.handleEdit = (i) => {
  const item = financeData[i];
  editIndex = i;

  document.getElementById("title").value = item.title;
  document.getElementById("amount").value = item.amount;
  document.getElementById("date").value = item.date;
  document.getElementById("status").value = item.status;
  document.getElementById("is-recurring").checked = item.isRecurring;

  const container = document.getElementById("form-container");
  container.classList.add("editing-mode");

  document.getElementById("form-title").innerHTML =
    "⚠️ EDITANDO LANÇAMENTO EXISTENTE";
  document.getElementById("submit-btn").innerText = "Salvar Alterações";
  document.getElementById("submit-btn").style.background = "var(--warning)";
  document.getElementById("submit-btn").style.color = "black";
  document.getElementById("cancel-btn").style.display = "block";

  window.scrollTo({ top: 0, behavior: "smooth" });
};

window.resetForm = () => {
  editIndex = null;
  document.getElementById("finance-form").reset();
  document.getElementById("date").valueAsDate = viewDate;

  const container = document.getElementById("form-container");
  container.classList.remove("editing-mode");

  document.getElementById("form-title").innerText = "Novo Lançamento";
  document.getElementById("submit-btn").innerText = "Adicionar Lançamento";
  document.getElementById("submit-btn").style.background = "var(--accent)";
  document.getElementById("submit-btn").style.color = "white";
  document.getElementById("cancel-btn").style.display = "none";
};

document.getElementById("finance-form").onsubmit = (e) => {
  e.preventDefault();

  const btn = document.getElementById("submit-btn");

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

  // animação de sucesso
  btn.classList.add("success");
  btn.innerText = "Salvo!";

  setTimeout(() => {
    btn.classList.remove("success");
    btn.innerText =
      editIndex !== null ? "Salvar Alterações" : "Adicionar Lançamento";

    resetForm();
    render();
  }, 800);
};

window.toggleStatus = (i) => {
  financeData[i].status =
    financeData[i].status === "pago" ? "pendente" : "pago";

  localStorage.setItem("brokerFinance", JSON.stringify(financeData));
  render();

  // animação
  setTimeout(() => {
    const cards = document.querySelectorAll(".item-card");
    if (cards[i]) {
      cards[i].classList.add("animate-status");
      setTimeout(() => {
        cards[i].classList.remove("animate-status");
      }, 300);
    }
  }, 50);
};

window.handleDelete = (i) => {
  if (confirm("Apagar?")) {
    financeData.splice(i, 1);
    localStorage.setItem("brokerFinance", JSON.stringify(financeData));
    render();
  }
};

window.clearMonth = () => {
  if (confirm("Limpar mês?")) {
    const m = viewDate.getMonth(),
      a = viewDate.getFullYear();

    financeData = financeData.filter((i) => {
      const d = new Date(i.date + "T00:00:00");
      return d.getMonth() !== m || d.getFullYear() !== a;
    });

    localStorage.setItem("brokerFinance", JSON.stringify(financeData));
    render();
  }
};

window.changeMonth = (diff) => {
  viewDate.setMonth(viewDate.getMonth() + diff);
  resetForm();
  updateDisplay();
};

window.copyRecurrent = () => {
  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();

  const recurring = financeData.filter((item) => {
    const d = new Date(item.date + "T00:00:00");
    return (
      item.isRecurring &&
      (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear)
    );
  });

  if (recurring.length === 0) {
    alert("Nenhuma conta fixa encontrada.");
    return;
  }

  const newItems = recurring
    .filter((item) => {
      const oldDate = new Date(item.date + "T00:00:00");

      const alreadyExists = financeData.some((i) => {
        const d = new Date(i.date + "T00:00:00");
        return (
          i.title === item.title &&
          i.isRecurring &&
          d.getMonth() === currentMonth &&
          d.getFullYear() === currentYear
        );
      });

      if (alreadyExists) return false;

      item._newDate = new Date(currentYear, currentMonth, oldDate.getDate());

      return true;
    })
    .map((item) => ({
      ...item,
      date: item._newDate.toISOString().split("T")[0],
      status: "pendente",
    }));

  if (newItems.length === 0) {
    alert("Já importado.");
    return;
  }

  financeData.push(...newItems);

  localStorage.setItem("brokerFinance", JSON.stringify(financeData));
  render();

  alert("Importado com sucesso!");
};

updateDisplay();

window.exportData = () => {
  const dataStr = JSON.stringify(financeData, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "finance-backup.json";
  a.click();
};

window.importData = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (!Array.isArray(data)) {
        alert("Arquivo inválido.");
        return;
      }

      // 🔥 evita duplicados
      const novos = data.filter((novo) => {
        return !financeData.some((existente) => {
          return (
            existente.title === novo.title &&
            existente.date === novo.date &&
            existente.amount == novo.amount
          );
        });
      });

      financeData = [...financeData, ...novos];

      localStorage.setItem("brokerFinance", JSON.stringify(financeData));
      render();

      alert(`${novos.length} itens importados!`);
    } catch {
      alert("Erro ao importar arquivo.");
    }
  };

  reader.readAsText(file);
};
