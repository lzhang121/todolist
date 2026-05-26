const STORAGE_KEY = "todolist.items.v1";
const UNDO_TIMEOUT_MS = 5000;
const SAMPLE_TODOS = ["了解项目需求", "完成第一版待办页面"];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoDateInput = document.getElementById("todo-date");
const todoList = document.getElementById("todo-list");
const todoStats = document.getElementById("todo-stats");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clear-completed");
const emptyState = document.getElementById("empty-state");
const emptyTitle = emptyState.querySelector(".empty-title");
const emptyHint = emptyState.querySelector(".empty-hint");
const emptySampleBtn = document.getElementById("empty-sample");
const toast = document.getElementById("toast");
const toastUndoBtn = document.getElementById("toast-undo");
const storageBanner = document.getElementById("storage-banner");
const storageRetryBtn = document.getElementById("storage-retry");

let todos = loadTodos();
let currentFilter = "all";
let lastAddedId = null;
let pendingUndo = null;
let undoTimerId = null;
init();

function init() {
  render();
  updateFilterButtons();
  todoInput.focus();

  todoForm.addEventListener("submit", onSubmit);
  todoInput.addEventListener("keydown", onInputKeydown);
  todoList.addEventListener("click", onListClick);
  todoList.addEventListener("change", onListChange);
  todoList.addEventListener("keydown", onListKeydown);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      currentFilter = button.dataset.filter;
      updateFilterButtons();
      render();
    });
  });

  clearCompletedBtn.addEventListener("click", () => {
    clearPendingUndo();
    todos = todos.filter((todo) => !todo.completed);
    saveTodos();
    render();
  });

  emptySampleBtn.addEventListener("click", addSampleTodos);
  toastUndoBtn.addEventListener("click", undoDelete);
  storageRetryBtn.addEventListener("click", () => {
    if (saveTodos()) {
      storageBanner.hidden = true;
    }
  });
}

function onSubmit(event) {
  event.preventDefault();
  const text = todoInput.value.trim();

  if (!text) {
    flashInputError();
    return;
  }

  const dueDate = normalizeDueDate(todoDateInput.value);
  addTodo(text, dueDate);
  todoInput.value = "";
  todoDateInput.value = "";
  todoInput.focus();
}

function onInputKeydown(event) {
  if (event.key === "Escape") {
    todoInput.value = "";
    todoDateInput.value = "";
    todoInput.focus();
  }
}

function addTodo(text, dueDate = null) {
  clearPendingUndo();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  todos.unshift({
    id,
    text,
    completed: false,
    dueDate,
  });
  lastAddedId = id;
  saveTodos();
  render();
}

function addSampleTodos() {
  clearPendingUndo();
  const tomorrow = shiftISODate(getTodayISO(), 1);
  const samples = SAMPLE_TODOS.map((text, index) => ({
    id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 7)}`,
    text,
    completed: false,
    dueDate: index === 0 ? tomorrow : null,
  }));
  todos = [...samples, ...todos];
  lastAddedId = samples[0].id;
  saveTodos();
  render();
  todoInput.focus();
}

function onListClick(event) {
  if (!event.target.classList.contains("delete-btn")) {
    return;
  }

  const listItem = event.target.closest(".todo-item");
  if (!listItem) {
    return;
  }

  deleteTodoById(listItem.dataset.id);
}

function onListChange(event) {
  if (!event.target.classList.contains("todo-checkbox")) {
    return;
  }

  const listItem = event.target.closest(".todo-item");
  if (!listItem) {
    return;
  }

  const todo = todos.find((item) => item.id === listItem.dataset.id);
  if (!todo) {
    return;
  }

  todo.completed = event.target.checked;
  saveTodos();
  render();
}

function onListKeydown(event) {
  if (event.key !== "Delete" && event.key !== "Backspace") {
    return;
  }

  if (event.target.classList.contains("delete-btn")) {
    return;
  }

  const listItem = event.target.closest(".todo-item");
  if (!listItem || document.activeElement !== listItem) {
    return;
  }

  event.preventDefault();
  deleteTodoById(listItem.dataset.id);
}

function deleteTodoById(id) {
  const index = todos.findIndex((todo) => todo.id === id);
  if (index === -1) {
    return;
  }

  const [removed] = todos.splice(index, 1);
  saveTodos();
  showUndoToast(removed, index);
  render();
}

function showUndoToast(todo, index) {
  clearPendingUndo();
  pendingUndo = { todo, index };
  toast.hidden = false;

  undoTimerId = window.setTimeout(() => {
    clearPendingUndo();
  }, UNDO_TIMEOUT_MS);
}

function undoDelete() {
  if (!pendingUndo) {
    return;
  }

  const { todo, index } = pendingUndo;
  const insertAt = Math.min(index, todos.length);
  todos.splice(insertAt, 0, todo);
  clearPendingUndo();
  saveTodos();
  render();
  todoInput.focus();
}

function clearPendingUndo() {
  if (undoTimerId !== null) {
    window.clearTimeout(undoTimerId);
    undoTimerId = null;
  }
  pendingUndo = null;
  toast.hidden = true;
}

function getVisibleTodos() {
  return todos.filter((todo) => {
    if (currentFilter === "active") {
      return !todo.completed;
    }
    if (currentFilter === "completed") {
      return todo.completed;
    }
    return true;
  });
}

function render() {
  const visibleTodos = getVisibleTodos();
  renderEmptyState(visibleTodos);
  renderTodoList(visibleTodos);
  updateStats();
}

function renderEmptyState(visibleTodos) {
  if (visibleTodos.length > 0) {
    emptyState.hidden = true;
    return;
  }

  emptyState.hidden = false;
  emptySampleBtn.hidden = true;

  if (todos.length === 0) {
    emptyTitle.textContent = "还没有待办";
    emptyHint.textContent = "在上方输入内容，按 Enter 添加";
    emptySampleBtn.hidden = false;
    return;
  }

  if (currentFilter === "completed" && !todos.some((todo) => todo.completed)) {
    emptyTitle.textContent = "还没有已完成";
    emptyHint.textContent = "勾选左侧复选框即可标记完成";
    return;
  }

  emptyTitle.textContent = "没有匹配的待办";
  emptyHint.textContent = "试试切换「全部」或其它筛选";
}

function renderTodoList(visibleTodos) {
  const visibleIds = new Set(visibleTodos.map((todo) => todo.id));
  const existingItems = new Map();

  todoList.querySelectorAll(".todo-item").forEach((element) => {
    existingItems.set(element.dataset.id, element);
  });

  existingItems.forEach((element, id) => {
    if (!visibleIds.has(id)) {
      element.remove();
    }
  });

  visibleTodos.forEach((todo, index) => {
    let element = existingItems.get(todo.id);

    if (!element) {
      element = createTodoElement(todo);
      const nextElement = todoList.children[index];
      if (nextElement) {
        todoList.insertBefore(element, nextElement);
      } else {
        todoList.appendChild(element);
      }
    } else if (todoList.children[index] !== element) {
      const nextElement = todoList.children[index];
      if (nextElement) {
        todoList.insertBefore(element, nextElement);
      } else {
        todoList.appendChild(element);
      }
    }

    syncTodoElement(element, todo);
  });
}

function createTodoElement(todo) {
  const element = document.createElement("li");
  element.className = "todo-item";
  element.dataset.id = todo.id;
  element.tabIndex = 0;

  const checkbox = document.createElement("input");
  checkbox.className = "todo-checkbox";
  checkbox.type = "checkbox";
  checkbox.setAttribute("aria-label", `标记「${todo.text}」为完成`);

  const content = document.createElement("div");
  content.className = "todo-content";

  const text = document.createElement("span");
  text.className = "todo-text";
  text.textContent = todo.text;
  text.title = todo.text;

  content.append(text);

  const dueDateEl = document.createElement("time");
  dueDateEl.className = "todo-date";
  content.append(dueDateEl);

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-btn";
  deleteBtn.type = "button";
  deleteBtn.textContent = "删除";
  deleteBtn.setAttribute("aria-label", `删除「${todo.text}」`);

  element.append(checkbox, content, deleteBtn);
  syncTodoDateElement(dueDateEl, todo);
  return element;
}

function syncTodoElement(element, todo) {
  element.classList.toggle("completed", todo.completed);

  const checkbox = element.querySelector(".todo-checkbox");
  checkbox.checked = todo.completed;
  checkbox.setAttribute("aria-label", `标记「${todo.text}」为完成`);

  const text = element.querySelector(".todo-text");
  text.textContent = todo.text;
  text.title = todo.text;

  const dueDateEl = element.querySelector(".todo-date");
  if (dueDateEl) {
    syncTodoDateElement(dueDateEl, todo);
  }

  const deleteBtn = element.querySelector(".delete-btn");
  deleteBtn.setAttribute("aria-label", `删除「${todo.text}」`);

  if (todo.id === lastAddedId) {
    element.classList.add("is-new");
    element.addEventListener(
      "animationend",
      () => {
        element.classList.remove("is-new");
        if (lastAddedId === todo.id) {
          lastAddedId = null;
        }
      },
      { once: true }
    );
  }
}

function updateStats() {
  const remaining = todos.filter((todo) => !todo.completed).length;

  if (todos.length === 0) {
    todoStats.textContent = "0 项待完成";
    return;
  }

  if (remaining === 0) {
    todoStats.textContent = "全部完成";
    return;
  }

  todoStats.textContent = `${remaining} 项待完成`;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function flashInputError() {
  todoInput.classList.add("input-error");
  window.setTimeout(() => {
    todoInput.classList.remove("input-error");
  }, 300);
}

function normalizeDueDate(value) {
  if (!value || !DATE_PATTERN.test(value)) {
    return null;
  }
  return value;
}

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shiftISODate(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00`);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDueDateLabel(isoDate) {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function getDueDateStatus(isoDate, completed) {
  if (completed) {
    return "done";
  }

  const today = getTodayISO();
  if (isoDate < today) {
    return "overdue";
  }
  if (isoDate === today) {
    return "today";
  }
  return "upcoming";
}

function syncTodoDateElement(element, todo) {
  if (!todo.dueDate) {
    element.hidden = true;
    element.textContent = "";
    element.removeAttribute("datetime");
    element.className = "todo-date";
    return;
  }

  element.hidden = false;
  element.dateTime = todo.dueDate;
  element.textContent = formatDueDateLabel(todo.dueDate);

  const status = getDueDateStatus(todo.dueDate, todo.completed);
  element.className = "todo-date";
  if (status === "overdue") {
    element.classList.add("is-overdue");
  } else if (status === "today") {
    element.classList.add("is-today");
  }
}

function normalizeTodo(todo) {
  return {
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    dueDate: normalizeDueDate(todo.dueDate),
  };
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (todo) =>
          todo &&
          typeof todo.id === "string" &&
          typeof todo.text === "string" &&
          typeof todo.completed === "boolean"
      )
      .map(normalizeTodo);
  } catch {
    return [];
  }
}

function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    storageBanner.hidden = true;
    return true;
  } catch {
    storageBanner.hidden = false;
    return false;
  }
}
