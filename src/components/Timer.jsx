import { MODES, formatClock } from "../hooks/usePomodoro.js";

export default function Timer({ timer, activeTask }) {
  const total = MODES[timer.mode].minutes * 60_000;
  const progress = 1 - timer.remainingMs / total;
  const radius = 88;
  const circumference = 2 * Math.PI * radius;

  return (
    <section className={`timer mode-${timer.mode}`} aria-label="Pomodoro timer">
      <div className="modes" role="group" aria-label="Timer mode">
        {Object.entries(MODES).map(([key, { label }]) => (
          <button key={key} type="button" aria-pressed={timer.mode === key} onClick={() => timer.switchMode(key)}>{label}</button>
        ))}
      </div>
      <div className="dial">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <circle cx="100" cy="100" r={radius} className="track" />
          <circle cx="100" cy="100" r={radius} className="progress" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - progress)} />
        </svg>
        <p className="clock" role="timer" aria-live="off">{formatClock(timer.remainingMs)}</p>
      </div>
      <p className="focus-on">{activeTask ? <>Focusing on <strong>{activeTask.text}</strong></> : "Pick a task below to focus on"}</p>
      <div className="controls">
        {timer.running
          ? <button type="button" className="primary" onClick={timer.pause}>Pause</button>
          : <button type="button" className="primary" onClick={timer.start}>Start</button>}
        <button type="button" onClick={timer.reset}>Reset</button>
      </div>
    </section>
  );
}
