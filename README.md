# 🤖 GitHub Copilot Agent Office

A React app that visualizes your GitHub Copilot CLI agents as animated office workers in a 2D office scene.

## Features

- **Animated Characters** — Each agent is rendered as a walking stick-figure office worker with their own color and emoji label.
- **Office Layout** — A break room (green zone, left) where idle agents relax, and a work area (right) with individual labeled desks/stations.
- **State Machine** — Every agent cycles through four states:
  - 🟡 **Idle** — Relaxing in the break room
  - 🔵 **Walking ↗** — Animated walk to their work station
  - 🟢 **Working ⚡** — Typing animation at their desk, task badge shown
  - 🟣 **Returning ↙** — Walking back to the break room
- **Orchestrator Agent** — The central 🎯 Orchestrator sits at the Command Center and dispatches sub-agents.
- **Sub-Agents** — Code Writer 💻, Reviewer 🔍, Test Runner 🧪, Docs Writer 📝, Researcher 🔬
- **Control Panel** — Dispatch individual agents or all idle agents at once.
- **Activity Log** — Real-time log of agent dispatches and task completions.
- **Auto-Sim Mode** — Toggle to automatically dispatch idle agents on a timer for a continuous simulation.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- Pure CSS animations (no animation library needed)
- CSS transitions for smooth agent walking
