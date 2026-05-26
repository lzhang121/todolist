const STORAGE_KEY = "todolist.items.v1";

const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const todoStats = document.getElementById("todo-stats");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clear-completed");

let todos = loadTodos();
let currentFilter = "all";

render();

todoForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = todoInput.value.trim();

  if (!text) {
    return;
  }

  todos.unshift({
    id: Date.now().toString(),
    text,
    completed: false,
  });

  todoInput.value = "";
  saveTodos();
  render();
});

todoList.addEventListener("click", (event) => {
  const listItem = event.target.closest(".todo-item");
  if (!listItem) {
    return;
  }

  const { id } = listItem.dataset;

  if (event.target.classList.contains("delete-btn")) {
    todos = todos.filter((todo) => todo.id !== id);
    saveTodos();
    render();
  }
});

todoList.addEventListener("change", (event) => {
  if (!event.target.classList.contains("todo-checkbox")) {
    return;
  }

  const listItem = event.target.closest(".todo-item");
  if (!listItem) {
    return;
  }

  const { id } = listItem.dataset;
  const todo = todos.find((item) => item.id === id);
  if (!todo) {
    return;
  }

  todo.completed = event.target.checked;
  saveTodos();
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    render();
  });
});

clearCompletedBtn.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.completed);
  saveTodos();
  render();
});

function render() {
  const visibleTodos = todos.filter((todo) => {
    if (currentFilter === "active") {
      return !todo.completed;
    }
    if (currentFilter === "completed") {
      return todo.completed;
    }
    return true;
  });

  if (visibleTodos.length === 0) {
    todoList.innerHTML = '<li class="empty">暂无待办事项</li>';
  } else {
    todoList.innerHTML = visibleTodos
      .map(
        (todo) => `
        <li class="todo-item ${todo.completed ? "completed" : ""}" data-id="${todo.id}">
          <input class="todo-checkbox" type="checkbox" ${
            todo.completed ? "checked" : ""
          } aria-label="切换完成状态">
          <span class="todo-text">${escapeHtml(todo.text)}</span>
          <button class="delete-btn" type="button" aria-label="删除待办">删除</button>
        </li>
      `
      )
      .join("");
  }

  const remaining = todos.filter((todo) => !todo.completed).length;
  todoStats.textContent = `${remaining} 个未完成`;
}

function updateFilterButtons() {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === currentFilter;
    button.classList.toggle("active", isActive);
  });
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

    return parsed.filter(
      (todo) =>
        todo &&
        typeof todo.id === "string" &&
        typeof todo.text === "string" &&
        typeof todo.completed === "boolean"
    );
  } catch {
    return [];
  }
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
