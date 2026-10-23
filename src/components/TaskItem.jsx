import { useState } from "react";

export default function TaskItem({ task, isActive, isFirst, isLast, dispatch, onFocus, dragProps }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);

  const save = () => {
    dispatch({ type: "edit", id: task.id, text: draft });
    setEditing(false);
  };

  return (
    <li className={`task${task.done ? " done" : ""}${isActive ? " active" : ""}`} {...dragProps}>
      <span className="grip" aria-hidden="true">⋮⋮</span>
      <input
        type="checkbox"
        checked={task.done}
        onChange={() => dispatch({ type: "toggle", id: task.id })}
        aria-label={`Mark "${task.text}" as ${task.done ? "not done" : "done"}`}
      />
      {editing ? (
        <form className="edit" onSubmit={(event) => { event.preventDefault(); save(); }}>
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => { if (event.key === "Escape") { setDraft(task.text); setEditing(false); } }}
            aria-label="Edit task"
            maxLength={140}
            autoFocus
          />
        </form>
      ) : (
        <span className="text" onDoubleClick={() => setEditing(true)}>{task.text}</span>
      )}
      {task.pomodoros > 0 && <span className="tomatoes" aria-label={`${task.pomodoros} pomodoros`}>{"🍅".repeat(Math.min(task.pomodoros, 5))}{task.pomodoros > 5 ? `+${task.pomodoros - 5}` : ""}</span>}
      <div className="task-actions">
        {!task.done && <button type="button" onClick={() => onFocus(task.id)} aria-pressed={isActive} title="Focus on this task">🎯</button>}
        <button type="button" onClick={() => setEditing(true)} aria-label={`Edit "${task.text}"`}>✎</button>
        <button type="button" disabled={isFirst} onClick={() => dispatch({ type: "move", id: task.id, offset: -1 })} aria-label={`Move "${task.text}" up`}>↑</button>
        <button type="button" disabled={isLast} onClick={() => dispatch({ type: "move", id: task.id, offset: 1 })} aria-label={`Move "${task.text}" down`}>↓</button>
        <button type="button" onClick={() => dispatch({ type: "remove", id: task.id })} aria-label={`Delete "${task.text}"`}>✕</button>
      </div>
    </li>
  );
}
