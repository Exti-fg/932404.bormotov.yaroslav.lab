"use strict";

const STORAGE_KEY = "ecoTrackerStateV1";
const PROGRESS_STEP = 10;
const REMOVE_ANIMATION_MS = 300;

function getInitialHabits() {
    return Array.from(document.querySelectorAll("#habit-list .habit-card"))
        .map(card => {
            const name = card.dataset.habitName;
            const progress = Number(card.dataset.progress);
            const description = card.querySelector("p");
            const icon = card.querySelector(".habit-icon");

            if (!name || !Number.isFinite(progress) || !description || !icon) {
                console.error("Не удалось прочитать данные одной из привычек из HTML.");
                return null;
            }

            return {
                id: card.dataset.habitId || createHabitId(),
                name,
                progress: Math.max(0, Math.min(100, progress)),
                description: description.textContent,
                icon: icon.textContent
            };
        })
        .filter(habit => habit !== null);
}

function createHabitId() {
    return `habit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function readSavedState(defaultHabits) {
    try {
        const savedValue = localStorage.getItem(STORAGE_KEY);

        if (savedValue === null) {
            return { theme: "light", habits: defaultHabits };
        }

        const savedState = JSON.parse(savedValue);
        const validTheme = savedState.theme === "light" || savedState.theme === "dark";
        const validHabits = Array.isArray(savedState.habits)
            && savedState.habits.every(habit =>
                habit
                && typeof habit.id === "string"
                && typeof habit.name === "string"
                && habit.name.trim() !== ""
                && Number.isFinite(habit.progress)
            );

        if (!validTheme || !validHabits) {
            throw new TypeError("В сохранённых данных неверный формат.");
        }

        const savedHabits = savedState.habits.map(habit => ({
            id: habit.id,
            name: habit.name.trim(),
            progress: Math.max(0, Math.min(100, habit.progress)),
            description: typeof habit.description === "string"
                ? habit.description
                : "Отмечайте привычку, чтобы поддерживать прогресс.",
            icon: typeof habit.icon === "string" ? habit.icon : "🌿"
        }));
        const savedHabitsById = new Map(savedHabits.map(habit => [habit.id, habit]));
        const defaultHabitIds = new Set(defaultHabits.map(habit => habit.id));
        const restoredHabits = [
            ...defaultHabits.map(habit => savedHabitsById.get(habit.id) || habit),
            ...savedHabits.filter(habit => !defaultHabitIds.has(habit.id))
        ];

        return { theme: savedState.theme, habits: restoredHabits };
    } catch (error) {
        console.error("Не удалось восстановить состояние из localStorage:", error);
        return { theme: "light", habits: defaultHabits };
    }
}

function saveState(state) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
        console.error("Не удалось сохранить состояние в localStorage:", error);
    }
}

function createHabitCard(habit, canDelete) {
    const card = document.createElement("article");
    card.className = "habit-card";
    card.dataset.habitId = habit.id;
    card.dataset.habitName = habit.name;
    card.dataset.progress = String(habit.progress);

    const icon = document.createElement("span");
    icon.className = "habit-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = habit.icon || "🌿";

    const title = document.createElement("h3");
    title.textContent = habit.name;

    const description = document.createElement("p");
    description.textContent = habit.description || "Отмечайте привычку, чтобы поддерживать прогресс.";

    const progressRow = document.createElement("div");
    progressRow.className = "progress-row";

    const progressLabel = document.createElement("span");
    progressLabel.textContent = "Прогресс";

    const progressValue = document.createElement("strong");
    progressValue.textContent = `${habit.progress}%`;

    const progressTrack = document.createElement("div");
    progressTrack.className = "progress-track";
    progressTrack.setAttribute("role", "progressbar");
    progressTrack.setAttribute("aria-label", `Прогресс: ${habit.name}`);
    progressTrack.setAttribute("aria-valuemin", "0");
    progressTrack.setAttribute("aria-valuemax", "100");
    progressTrack.setAttribute("aria-valuenow", String(habit.progress));

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.setAttribute("aria-hidden", "true");
    progressFill.style.width = `${habit.progress}%`;
    progressTrack.append(progressFill);

    const actions = document.createElement("div");
    actions.className = "habit-actions";

    const markButton = document.createElement("button");
    markButton.type = "button";
    markButton.className = "mark-habit";
    markButton.dataset.action = "mark";
    markButton.textContent = "Отметить";

    progressRow.append(progressLabel, progressValue);
    actions.append(markButton);
    if (canDelete) {
        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.className = "remove-habit";
        removeButton.dataset.action = "remove";
        removeButton.setAttribute("aria-label", `Удалить привычку: ${habit.name}`);
        removeButton.textContent = "Удалить";
        actions.append(removeButton);
    }
    card.append(icon, title, description, progressRow, progressTrack, actions);

    return card;
}

function renderHabits(habitList, habits, defaultHabitIds) {
    habitList.replaceChildren(...habits.map(habit =>
        createHabitCard(habit, !defaultHabitIds.has(habit.id))
    ));
}

function applyTheme(body, themeButton, theme) {
    const isDark = theme === "dark";
    body.classList.toggle("dark-theme", isDark);
    themeButton.textContent = isDark ? "Светлая тема" : "Тёмная тема";
    themeButton.setAttribute("aria-pressed", String(isDark));
}

function updateProgress(card, progress) {
    const progressValue = card.querySelector(".progress-row strong");
    const progressTrack = card.querySelector(".progress-track");
    const progressFill = card.querySelector(".progress-fill");

    if (!progressValue || !progressTrack || !progressFill) {
        console.error("Невозможно обновить прогресс: в карточке отсутствует индикатор.");
        return false;
    }

    card.dataset.progress = String(progress);
    progressValue.textContent = `${progress}%`;
    progressTrack.setAttribute("aria-valuenow", String(progress));
    progressFill.style.width = `${progress}%`;
    return true;
}

function initializeEcoTracker() {
    const body = document.querySelector("body");
    const habitSection = document.querySelector("#habits");
    const habitContent = document.getElementById("habit-content");
    const habitList = document.getElementById("habit-list");
    const habitNameInput = document.getElementById("new-habit-name");
    const habitMessage = document.getElementById("habit-message");
    const addButton = document.getElementById("add-habit");
    const resetButton = document.getElementById("reset-progress");
    const hideButton = document.getElementById("toggle-habits");
    const themeButton = document.getElementById("theme-toggle");

    if (!body || !habitSection || !habitContent || !habitList || !habitNameInput || !habitMessage
        || !addButton || !resetButton || !hideButton || !themeButton) {
        console.error("Эко-трекер не запущен: на странице отсутствует один из обязательных элементов.");
        return;
    }

    const initialHabits = getInitialHabits();
    const defaultHabitIds = new Set(initialHabits.map(habit => habit.id));
    const state = readSavedState(initialHabits);
    renderHabits(habitList, state.habits, defaultHabitIds);
    applyTheme(body, themeButton, state.theme);

    addButton.addEventListener("click", () => {
        const name = habitNameInput.value.trim();
        if (name === "") {
            habitMessage.textContent = "Введите название привычки.";
            habitNameInput.focus();
            return;
        }

        if (name.length > 80) {
            habitMessage.textContent = "Название привычки должно быть не длиннее 80 символов.";
            return;
        }

        const habit = {
            id: createHabitId(),
            name,
            progress: 0,
            description: "Отмечайте привычку, чтобы поддерживать прогресс.",
            icon: "🌿"
        };
        state.habits.push(habit);
        habitList.append(createHabitCard(habit, true));
        habitNameInput.value = "";
        habitMessage.textContent = `Добавлена привычка «${name}».`;
        saveState(state);
    });

    habitList.addEventListener("click", event => {
        const target = event.target;
        if (!(target instanceof Element)) {
            return;
        }

        const actionButton = target.closest("button[data-action]");
        const card = target.closest(".habit-card");

        if (!actionButton || !card || !habitList.contains(card)) {
            return;
        }

        const habitId = card.dataset.habitId;
        const habit = state.habits.find(item => item.id === habitId);
        if (!habit) {
            console.error("Не удалось найти данные привычки для выбранной карточки.");
            return;
        }

        if (actionButton.dataset.action === "mark") {
            const nextProgress = Math.min(100, habit.progress + PROGRESS_STEP);
            if (updateProgress(card, nextProgress)) {
                habit.progress = nextProgress;
                saveState(state);
            }
            return;
        }

        if (actionButton.dataset.action === "remove") {
            state.habits = state.habits.filter(item => item.id !== habitId);
            saveState(state);
            card.classList.add("fade-out");
            card.setAttribute("aria-hidden", "true");
            card.querySelectorAll("button").forEach(button => {
                button.disabled = true;
            });
            addButton.focus();
            window.setTimeout(() => card.remove(), REMOVE_ANIMATION_MS);
        }
    });

    resetButton.addEventListener("click", () => {
        const cards = document.querySelectorAll("#habit-list .habit-card:not(.fade-out)");
        let allUpdated = true;

        cards.forEach(card => {
            const habit = state.habits.find(item => item.id === card.dataset.habitId);
            if (!habit || !updateProgress(card, 0)) {
                allUpdated = false;
                return;
            }

            habit.progress = 0;
        });

        if (allUpdated) {
            saveState(state);
        }
    });

    hideButton.addEventListener("click", () => {
        const isHidden = habitContent.classList.toggle("collapsed");
        hideButton.textContent = isHidden ? "Показать секцию привычек" : "Скрыть секцию привычек";
        hideButton.setAttribute("aria-expanded", String(!isHidden));
    });

    themeButton.addEventListener("click", () => {
        state.theme = state.theme === "dark" ? "light" : "dark";
        applyTheme(body, themeButton, state.theme);
        saveState(state);
    });
}

initializeEcoTracker();
