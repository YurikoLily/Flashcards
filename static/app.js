const STORAGE_KEY = "flashcards-data";

const tsvInput = document.getElementById("tsv-input");
const manualForm = document.getElementById("manual-form");
const expressionInput = document.getElementById("expression");
const explanationInput = document.getElementById("explanation");
const cardsContainer = document.getElementById("cards");
const emptyState = document.getElementById("empty-state");
const toast = document.getElementById("toast");
const clearButton = document.getElementById("clear-button");
const exportButton = document.getElementById("export-button");

let cards = loadCards();
render();

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

function loadCards() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to parse stored flashcards", error);
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
}

function render() {
  cardsContainer.innerHTML = "";
  if (!cards.length) {
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;

  cards.forEach((card) => {
    const cardElement = document.createElement("article");
    cardElement.className = "card";

    const title = document.createElement("h3");
    title.textContent = card.expression;

    const content = document.createElement("p");
    content.textContent = card.explanation;

    const actions = document.createElement("div");
    actions.className = "card-actions";

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "secondary";
    deleteButton.textContent = "删除";
    deleteButton.addEventListener("click", () => removeCard(card.id));

    actions.appendChild(deleteButton);

    cardElement.appendChild(title);
    cardElement.appendChild(content);
    cardElement.appendChild(actions);

    cardsContainer.appendChild(cardElement);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  setTimeout(() => {
    toast.classList.remove("visible");
  }, 2200);
}

function addCards(newCards) {
  if (!newCards.length) {
    showToast("没有可导入的内容。");
    return;
  }

  cards = [...newCards, ...cards];
  persist();
  render();
  showToast(`已导入 ${newCards.length} 条记录。`);
}

function removeCard(id) {
  cards = cards.filter((card) => card.id !== id);
  persist();
  render();
  showToast("已删除一条记录。");
}

function parseTsv(text) {
  const rows = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split("\t"));

  if (!rows.length) {
    return [];
  }

  return rows
    .slice(1)
    .filter((columns) => columns.length >= 2)
    .map(([expression, explanation]) => ({
      id: createId(),
      expression: expression.trim(),
      explanation: explanation.trim(),
    }))
    .filter((card) => card.expression && card.explanation);
}

function parseFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const text = reader.result;
    if (typeof text !== "string") {
      showToast("无法读取文件内容。");
      return;
    }
    const parsed = parseTsv(text);
    addCards(parsed);
  };
  reader.onerror = () => showToast("读取文件失败，请重试。");
  reader.readAsText(file, "utf-8");
}

tsvInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }
  parseFile(file);
  tsvInput.value = "";
});

manualForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const expression = expressionInput.value.trim();
  const explanation = explanationInput.value.trim();
  if (!expression || !explanation) {
    showToast("表达和解释不能为空。");
    return;
  }
  cards = [
    {
      id: createId(),
      expression,
      explanation,
    },
    ...cards,
  ];
  persist();
  render();
  manualForm.reset();
  expressionInput.focus();
  showToast("新增卡片成功。");
});

clearButton.addEventListener("click", () => {
  if (!cards.length) {
    showToast("目前没有卡片。");
    return;
  }
  if (!confirm("确定要清空全部卡片吗？该操作不可恢复。")) {
    return;
  }
  cards = [];
  persist();
  render();
  showToast("已清空全部卡片。");
});

exportButton.addEventListener("click", () => {
  if (!cards.length) {
    showToast("没有内容可导出。");
    return;
  }
  const header = "表达\t解释";
  const lines = cards.map((card) => `${card.expression}\t${card.explanation}`);
  const blob = new Blob([`${header}\n${lines.join("\n")}`], {
    type: "text/tab-separated-values;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `flashcards-${new Date()
    .toISOString()
    .slice(0, 19)
    .replace(/[:T]/g, "-")}.tsv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast("已导出 TSV 文件。");
});
