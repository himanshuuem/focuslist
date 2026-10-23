export const initialTasks = [
  { id: "seed-1", text: "Plan the day in 5 minutes", done: true, pomodoros: 1 },
  { id: "seed-2", text: "Write the README for my React project", done: false, pomodoros: 0 },
  { id: "seed-3", text: "Review one pull request", done: false, pomodoros: 0 },
];

const newId = () => (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);

/** All task state changes go through here — easy to test, easy to reason about. */
export function tasksReducer(tasks, action) {
  switch (action.type) {
    case "add": {
      const text = action.text.trim().replace(/\s+/g, " ");
      if (!text) return tasks;
      return [...tasks, { id: action.id ?? newId(), text: text.slice(0, 140), done: false, pomodoros: 0 }];
    }
    case "toggle":
      return tasks.map((t) => (t.id === action.id ? { ...t, done: !t.done } : t));
    case "edit": {
      const text = action.text.trim();
      return text ? tasks.map((t) => (t.id === action.id ? { ...t, text: text.slice(0, 140) } : t)) : tasks;
    }
    case "remove":
      return tasks.filter((t) => t.id !== action.id);
    case "move": {
      const from = tasks.findIndex((t) => t.id === action.id);
      const to = from + action.offset;
      if (from < 0 || to < 0 || to >= tasks.length) return tasks;
      const next = [...tasks];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    }
    case "reorder": {
      const from = tasks.findIndex((t) => t.id === action.id);
      const to = tasks.findIndex((t) => t.id === action.beforeId);
      if (from < 0 || to < 0 || from === to) return tasks;
      const next = [...tasks];
      const [item] = next.splice(from, 1);
      next.splice(next.findIndex((t) => t.id === action.beforeId), 0, item);
      return next;
    }
    case "pomodoro":
      return tasks.map((t) => (t.id === action.id ? { ...t, pomodoros: t.pomodoros + 1 } : t));
    case "clearDone":
      return tasks.filter((t) => !t.done);
    default:
      throw new Error(`Unknown action: ${action.type}`);
  }
}

export const FILTERS = {
  all: () => true,
  active: (t) => !t.done,
  done: (t) => t.done,
};
