const form = document.querySelector('#task-form');
const taskInput = document.querySelector('#task-input');
const taskList = document.querySelector('#task-list');
const taskCount = document.querySelector('#task-count');
const emptyState = document.querySelector('#empty-state');
const clearCompletedButton = document.querySelector('#clear-completed');
const STORAGE_KEY = 'todo-list-tasks';

// Read previously saved tasks. Invalid stored data safely falls back to an empty list.
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');

function saveTasks() {
  // Saving after every change keeps the list available after a refresh.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function playCompletionSound() {
  // A tiny two-note chime made with the browser's built-in audio API.
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;

  const audioContext = new AudioContext();
  const now = audioContext.currentTime;

  [3500, 5000].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const start = now + index * 0.12;

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, start);
    volume.gain.setValueAtTime(0, start);
    volume.gain.linearRampToValueAtTime(0.12, start + 0.015);
    volume.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
}

function renderTasks() {
  taskList.innerHTML = '';
  const remaining = tasks.filter((task) => !task.completed).length;
  taskCount.textContent = `${remaining} ${remaining === 1 ? 'task' : 'tasks'} left`;
  emptyState.hidden = tasks.length !== 0;
  clearCompletedButton.hidden = !tasks.some((task) => task.completed);

  tasks.forEach((task) => {
    const item = document.createElement('li');
    item.className = `task-item${task.completed ? ' completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = task.completed;
    checkbox.id = `task-${task.id}`;
    checkbox.setAttribute('aria-label', `Mark ${task.text} as ${task.completed ? 'incomplete' : 'complete'}`);
    checkbox.addEventListener('change', () => toggleTask(task.id));

    const label = document.createElement('label');
    label.htmlFor = checkbox.id;
    label.textContent = task.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-task';
    deleteButton.type = 'button';
    deleteButton.setAttribute('aria-label', `Delete ${task.text}`);
    deleteButton.textContent = '×';
    deleteButton.addEventListener('click', () => deleteTask(task.id));

    item.append(checkbox, label, deleteButton);
    taskList.append(item);
  });
}

function toggleTask(id) {
  const selectedTask = tasks.find((task) => task.id === id);
  const isCompleting = selectedTask && !selectedTask.completed;
  tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
  saveTasks();
  renderTasks();

  // Only play the chime when a task becomes complete, not when it is unchecked.
  if (isCompleting) playCompletionSound();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.unshift({ id: Date.now(), text, completed: false });
  saveTasks();
  renderTasks();
  form.reset();
  taskInput.focus();
});

clearCompletedButton.addEventListener('click', () => {
  tasks = tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
});

renderTasks();
