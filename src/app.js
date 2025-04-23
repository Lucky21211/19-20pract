import {
    requestNotificationPermission,
    showPushNotification,
    scheduleReminder,
    disableNotifications
} from './push-notifications.js';

let tasks = [];
let filter = 'all';

const taskInput = document.getElementById('task-input');
const taskList = document.getElementById('task-list');

// Загрузка при старте
window.onload = () => {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log('Service Worker зарегистрирован'))
            .catch(err => console.error('Ошибка регистрации SW:', err));
    }

    const stored = localStorage.getItem('tasks');
    tasks = stored ? JSON.parse(stored) : [];
    renderTasks();
    scheduleReminder();

    document.getElementById('enable-notifications').onclick = requestNotificationPermission;
    document.getElementById('disable-notifications').onclick = disableNotifications;

    // Добавление задачи при отправке формы
    document.getElementById('task-form').addEventListener('submit', (e) => {
        e.preventDefault();
        addTask();
    });

    // Кнопки фильтра
    document.getElementById('filter-all').addEventListener('click', () => filterTasks('all'));
    document.getElementById('filter-active').addEventListener('click', () => filterTasks('active'));
    document.getElementById('filter-completed').addEventListener('click', () => filterTasks('completed'));
};

// Добавление новой задачи
function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const task = {
        id: Date.now(),
        text,
        completed: false
    };

    tasks.push(task);
    saveTasks();
    renderTasks();
    taskInput.value = '';

    showPushNotification('Новая задача добавлена: ' + text);
}

// Сохранение в localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Отрисовка списка задач
function renderTasks() {
    taskList.innerHTML = '';
    const filtered = tasks.filter(task => {
        if (filter === 'active') return !task.completed;
        if (filter === 'completed') return task.completed;
        return true;
    });

    filtered.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';

        const span = document.createElement('span');
        span.textContent = task.text;
        span.style.flex = '1';
        span.onclick = () => toggleTask(task.id);

        const delBtn = document.createElement('button');
        delBtn.textContent = '🗑️';
        delBtn.style.border = 'none';
        delBtn.style.background = 'transparent';
        delBtn.style.cursor = 'pointer';
        delBtn.onclick = (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        };

        li.style.display = 'flex';
        li.style.alignItems = 'center';
        li.appendChild(span);
        li.appendChild(delBtn);
        taskList.appendChild(li);
    });
}

// Переключение выполнения задачи
function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
    }
}

// Удаление задачи
function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
}

// Фильтрация задач
function filterTasks(mode) {
    filter = mode;
    renderTasks();
}
