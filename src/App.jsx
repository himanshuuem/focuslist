import { useEffect, useReducer, useRef, useState } from "react";
import { FILTERS, initialTasks, tasksReducer } from "./tasksReducer.js";
import { useLocalStorage } from "./hooks/useLocalStorage.js";
import { usePomodoro } from "./hooks/usePomodoro.js";
import Timer from "./components/Timer.jsx";
import TaskItem from "./components/TaskItem.jsx";

const STORAGE_KEY = "focuslist-tasks";

function loadTasks() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(stored) ? stored : initialTasks;
  } catch {
    return initialTasks;
  }
}

function chime() {
  try {
    const ctx = new AudioContext();
    [660, 880].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.25);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.25 + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.25);
      osc.stop(ctx.currentTime + i * 0.25 + 0.45);
    });
  } catch {
    // Audio unavailable — the title change still signals completion.
  }
}

export default function App() {
  const [tasks, dispatch] = useReducer(tasksReducer, undefined, loadTasks);
  const [filter, setFilter] = useLocalStorage("focuslist-filter", "all");
  const [activeId, setActiveId] = useState(null);
  const [draft, setDraft] = useState("");
  const [dragId, setDragId] = useState(null);
  const inputRef = useRef(null);
  const activeTask = tasks.find((t) => t.id === activeId && !t.done) ?? null;

  const timer = usePomodoro({
    onComplete: (mode) => {
      chime();
      if (mode === "focus" && activeTask) dispatch({ type: "pomodoro", id: activeTask.id });
    },
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage blocked — tasks live in memory for this session.
    }
  }, [tasks]);

  useEffect(() => {
    const clock = `${String(Math.floor(Math.ceil(timer.remainingMs / 1000) / 60)).padStart(2, "0")}:${String(Math.ceil(timer.remainingMs / 1000) % 60).padStart(2, "0")}`;
    document.title = timer.running ? `${clock} · FocusList` : "FocusList — Tasks + Pomodoro";
  }, [timer.remainingMs, timer.running]);

  const visible = tasks.filter(FILTERS[filter] ?? FILTERS.all);
  const remaining = tasks.filter((t) => !t.done).length;

  const addTask = (event) => {
    event.preventDefault();
    dispatch({ type: "add", text: draft });
    setDraft("");
    inputRef.current?.focus();
  };

  const dragProps = (task) => ({
    draggable: true,
    onDragStart: () => setDragId(task.id),
    onDragOver: (event) => event.preventDefault(),
    onDrop: () => {
      if (dragId) dispatch({ type: "reorder", id: dragId, beforeId: task.id });
      setDragId(null);
    },
    onDragEnd: () => setDragId(null),
  });

  return (
    <div className="app">
      <header className="top">
        <h1>FocusList <span aria-hidden="true">🍅</span></h1>
        <p>{remaining === 0 ? "Everything's done. Go outside! 🌤️" : `${remaining} task${remaining === 1 ? "" : "s"} left`}</p>
      </header>

      <Timer timer={timer} activeTask={activeTask} />

      <section className="list" aria-label="Tasks">
        <form className="add" onSubmit={addTask}>
          <label htmlFor="new-task" className="visually-hidden">New task</label>
          <input id="new-task" ref={inputRef} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="What needs doing?" maxLength={140} autoComplete="off" />
          <button type="submit" disabled={!draft.trim()}>Add</button>
        </form>

        <div className="filters" role="group" aria-label="Filter tasks">
          {Object.keys(FILTERS).map((key) => (
            <button key={key} type="button" aria-pressed={filter === key} onClick={() => setFilter(key)}>{key[0].toUpperCase() + key.slice(1)}</button>
          ))}
          <button type="button" className="clear" onClick={() => dispatch({ type: "clearDone" })} disabled={!tasks.some((t) => t.done)}>Clear done</button>
        </div>

        {visible.length === 0 ? (
          <p className="empty">{filter === "done" ? "Nothing finished yet. You've got this." : "No tasks here. Add one above ✍️"}</p>
        ) : (
          <ul className="tasks">
            {visible.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                isActive={task.id === activeId}
                isFirst={index === 0}
                isLast={index === visible.length - 1}
                dispatch={dispatch}
                onFocus={(id) => setActiveId((current) => (current === id ? null : id))}
                dragProps={dragProps(task)}
              />
            ))}
          </ul>
        )}
        <p className="tip">Double-click a task to edit it. Drag to reorder, or use ↑ ↓.</p>
      </section>

      <footer className="footer">Built with React by <a href="https://github.com/himanshuuem">Himanshu</a></footer>
    </div>
  );
}
