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
- **Copilot Log Streaming** — Configure a log directory, auto-pick the latest `process-1234.log`-style file, and stream lifecycle events from Copilot CLI output in real time.

## Running Locally

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Workspace and Log Directory Configuration

- This app does **not** set the Copilot workspace path.
- The workspace is determined by where you launch Copilot CLI. Run Copilot from the target repository/folder you want agents to use.
- In this app, click **Configure Log Path** and choose the folder where Copilot writes `process-*.log` files.
- Click **Start Copilot Stream** to auto-follow the newest `process-*.log` in that folder.
- If you get "No process log found", choose the parent folder that actually contains files like `process-1234.log`.

To stream real Copilot logs:
1. Click **Configure Log Path** and select the folder containing Copilot CLI logs.
2. Click **Start Copilot Stream**.
3. The app will automatically follow the most recent `process-*.log` file in that directory.

## Build

```bash
npm run build
npm run preview
```

## Tech Stack

- [React 19](https://react.dev/) + [Vite 8](https://vite.dev/)
- Pure CSS animations (no animation library needed)
- CSS transitions for smooth agent walking
