import { describe, expect, it, vi, afterEach } from "vitest";
import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App.jsx";
import { tasksReducer } from "./tasksReducer.js";
import { formatClock, usePomodoro } from "./hooks/usePomodoro.js";

const base = [
  { id: "a", text: "A", done: false, pomodoros: 0 },
  { id: "b", text: "B", done: true, pomodoros: 0 },
  { id: "c", text: "C", done: false, pomodoros: 0 },
];

describe("tasksReducer", () => {
  it("adds trimmed tasks and ignores blanks", () => {
    expect(tasksReducer([], { type: "add", text: "  hi   there ", id: "x" })).toEqual([{ id: "x", text: "hi there", done: false, pomodoros: 0 }]);
    expect(tasksReducer(base, { type: "add", text: "   " })).toBe(base);
  });

  it("moves within bounds", () => {
    expect(tasksReducer(base, { type: "move", id: "c", offset: -1 }).map((t) => t.id)).toEqual(["a", "c", "b"]);
    expect(tasksReducer(base, { type: "move", id: "a", offset: -1 })).toBe(base);
  });

  it("reorders by drop target and clears done", () => {
    expect(tasksReducer(base, { type: "reorder", id: "c", beforeId: "a" }).map((t) => t.id)).toEqual(["c", "a", "b"]);
    expect(tasksReducer(base, { type: "clearDone" }).map((t) => t.id)).toEqual(["a", "c"]);
  });

  it("throws on unknown actions", () => {
    expect(() => tasksReducer(base, { type: "nope" })).toThrow(/Unknown action/);
  });
});

describe("usePomodoro", () => {
  afterEach(() => vi.useRealTimers());

  it("counts down from a timestamp and fires onComplete", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { result } = renderHook(() => usePomodoro({ onComplete }));
    act(() => result.current.switchMode("short"));
    act(() => result.current.start());
    act(() => vi.advanceTimersByTime(60_000));
    expect(formatClock(result.current.remainingMs)).toBe("04:00");
    act(() => vi.advanceTimersByTime(5 * 60_000));
    expect(result.current.running).toBe(false);
    expect(onComplete).toHaveBeenCalledWith("short");
  });

  it("formats the clock", () => {
    expect(formatClock(25 * 60_000)).toBe("25:00");
    expect(formatClock(61_001)).toBe("01:02");
  });
});

describe("<App />", () => {
  it("adds, completes, filters and persists tasks", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("New task"), "Ship FocusList{Enter}");
    expect(screen.getByText("Ship FocusList")).toBeInTheDocument();

    await user.click(screen.getByLabelText('Mark "Ship FocusList" as done'));
    await user.click(screen.getByRole("button", { name: "Active" }));
    expect(screen.queryByText("Ship FocusList")).not.toBeInTheDocument();

    const saved = JSON.parse(localStorage.getItem("focuslist-tasks"));
    expect(saved.find((t) => t.text === "Ship FocusList").done).toBe(true);
  });

  it("edits a task inline with double-click", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.dblClick(screen.getByText("Review one pull request"));
    const input = screen.getByLabelText("Edit task");
    await user.clear(input);
    await user.type(input, "Review two pull requests{Enter}");
    expect(screen.getByText("Review two pull requests")).toBeInTheDocument();
  });

  it("selects a task to focus on", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getAllByTitle("Focus on this task")[0]);
    expect(screen.getByText(/Focusing on/)).toHaveTextContent("Write the README for my React project");
  });
});
