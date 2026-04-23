const CONFIG = {
  CATEGORIES: {
    vencimento: {
      icon: "alert-triangle",
      class: "cat-vencimento",
      label: "Vencimento",
    },
    pagamento: {
      icon: "dollar-sign",
      class: "cat-pagamento",
      label: "Pagamento",
    },
    reuniao: { icon: "briefcase", class: "cat-reuniao", label: "Reunião" },
    saude: { icon: "heart", class: "cat-saude", label: "Saúde" },
    outros: { icon: "calendar", class: "cat-outros", label: "Geral" },
  },
};

// Armazenamento em chave específica para não misturar com seu projeto de animes
let scheduleData = JSON.parse(localStorage.getItem("brokerSchedule")) || [];
let editIndex = null;

const elements = {
  form: document.getElementById("schedule-form"),
  container: document.getElementById("schedule-container"),
  submitBtn: document.getElementById("submit-btn"),
  clearBtn: document.getElementById("clear-btn"),
  dateInput: document.getElementById("date"),
};

/**
 * Inicialização do App
 */
const init = () => {
  setupTimeSelectors();
  updateTodayBanner();
  // Define a data padrão do input como a data de hoje
  elements.dateInput.valueAsDate = new Date();
  render();
};

/**
 * Preenche os seletores de Hora e Minuto
 */
const setupTimeSelectors = () => {
  const hSelect = document.getElementById("hour");
  const mSelect = document.getElementById("minute");
  for (let i = 0; i < 24; i++)
    hSelect.add(new Option(i.toString().padStart(2, "0")));
  for (let i = 0; i < 60; i += 5)
    mSelect.add(new Option(i.toString().padStart(2, "0")));
};

/**
 * Atualiza o banner informativo no topo da página
 */
const updateTodayBanner = () => {
  const banner = document.getElementById("today-banner");
  if (!banner) return;

  const agora = new Date();
  const opcoes = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const dataFormatada = agora.toLocaleDateString("pt-BR", opcoes);

  banner.innerHTML = `
        <h1>Hoje é ${dataFormatada}</h1>
        <p>Organize seus prazos e não perca nenhum vencimento.</p>
    `;
};

/**
 * Renderiza a lista de compromissos agrupada por data
 */
const render = () => {
  elements.container.innerHTML = "";

  // 1. Ordena os dados cronologicamente
  const sortedData = [...scheduleData].sort((a, b) => {
    return (a.date + a.time).localeCompare(b.date + b.time);
  });

  // 2. Agrupa os itens por data { "2024-05-10": [...], "2024-05-11": [...] }
  const grouped = sortedData.reduce((acc, curr) => {
    if (!acc[curr.date]) acc[curr.date] = [];
    acc[curr.date].push(curr);
    return acc;
  }, {});

  // 3. Datas de referência para alertas
  const hoje = new Date().toISOString().split("T")[0];
  const amanhaData = new Date();
  amanhaData.setDate(amanhaData.getDate() + 1);
  const amanha = amanhaData.toISOString().split("T")[0];

  // 4. Cria a interface para cada grupo de data
  Object.keys(grouped).forEach((date) => {
    const dateSection = document.createElement("div");
    dateSection.className = "date-group";

    // Formata a data do título (Ex: sex., 10/05/2024)
    const dateObj = new Date(date + "T00:00:00");
    const displayDate = dateObj.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      weekday: "short",
    });

    dateSection.innerHTML = `<h2 class="date-label">${displayDate}</h2>`;

    grouped[date].forEach((event) => {
      const cat = CONFIG.CATEGORIES[event.category] || CONFIG.CATEGORIES.outros;
      const originalIndex = scheduleData.indexOf(event);

      // Verifica se é HOJE ou AMANHÃ para destaque visual
      let priorityClass = "";
      let priorityTag = "";

      if (event.date === hoje) {
        priorityClass = "is-today";
        priorityTag = '<span class="priority-tag">HOJE</span>';
      } else if (event.date === amanha) {
        priorityTag =
          '<span class="priority-tag" style="background: var(--warning); color: black">AMANHÃ</span>';
      }

      const card = document.createElement("article");
      card.className = `event-card ${cat.class} ${priorityClass}`;
      card.innerHTML = `
                ${priorityTag}
                <strong class="event-title">${event.title}</strong>
                <div class="event-meta">
                    <span><i data-lucide="clock" style="width:14px; vertical-align: middle;"></i> ${event.time}</span>
                    <span><i data-lucide="${cat.icon}" style="width:14px; vertical-align: middle;"></i> ${cat.label}</span>
                </div>
                <div class="card-actions">
                    <button class="btn-icon" title="Editar" onclick="handleEdit(${originalIndex})"><i data-lucide="pencil"></i></button>
                    <button class="btn-icon" title="Excluir" onclick="handleDelete(${originalIndex})"><i data-lucide="trash-2"></i></button>
                </div>
            `;
      dateSection.appendChild(card);
    });
    elements.container.appendChild(dateSection);
  });

  // Inicializa os ícones do Lucide após renderizar o HTML
  if (window.lucide) lucide.createIcons();
};

/**
 * Lógica do Formulário (Salvar / Editar)
 */
elements.form.onsubmit = (e) => {
  e.preventDefault();

  const newEvent = {
    title: document.getElementById("title").value,
    date: document.getElementById("date").value,
    time: `${document.getElementById("hour").value}:${document.getElementById("minute").value}`,
    category: document.getElementById("category").value,
  };

  if (editIndex !== null) {
    scheduleData[editIndex] = newEvent;
    editIndex = null;
    elements.submitBtn.textContent = "Agendar";
    elements.submitBtn.style.background = "var(--primary)";
  } else {
    scheduleData.push(newEvent);
  }

  save();
};

/**
 * Prepara o formulário para edição
 */
window.handleEdit = (index) => {
  const item = scheduleData[index];
  document.getElementById("title").value = item.title;
  document.getElementById("date").value = item.date;
  const [h, m] = item.time.split(":");
  document.getElementById("hour").value = h;
  document.getElementById("minute").value = m;
  document.getElementById("category").value = item.category;

  editIndex = index;
  elements.submitBtn.textContent = "Salvar Alteração";
  elements.submitBtn.style.background = "var(--success)";
  window.scrollTo({ top: 0, behavior: "smooth" });
};

/**
 * Remove um compromisso
 */
window.handleDelete = (index) => {
  if (confirm("Deseja excluir este compromisso?")) {
    scheduleData.splice(index, 1);
    save();
  }
};

/**
 * Persistência de dados e atualização da tela
 */
const save = () => {
  localStorage.setItem("brokerSchedule", JSON.stringify(scheduleData));
  render();
  elements.form.reset();
  elements.dateInput.valueAsDate = new Date(); // Reset para data de hoje
};

/**
 * Limpa todos os dados
 */
elements.clearBtn.onclick = () => {
  if (confirm("Isso apagará TODOS os compromissos agendados. Tem certeza?")) {
    scheduleData = [];
    save();
  }
};

// Iniciar aplicação
init();
