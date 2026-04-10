// Agent definitions with positions for the office scene.
// Scene dimensions: 1100px wide × 600px tall.
// Break room occupies x: 0-200px (green zone on left).
// Work area: x: 200px → 1100px.
// Character size: ~40px wide, ~75px tall (including label).

export const TASKS = {
  'orchestrator':  ['Coordinating pipeline', 'Reviewing progress', 'Dispatching agents', 'Planning sprint'],
  'code-writer':   ['Writing auth module', 'Implementing API', 'Building UI components', 'Refactoring utils'],
  'reviewer':      ['Reviewing PR #42', 'Checking code style', 'Auditing security', 'Approving changes'],
  'test-runner':   ['Running unit tests', 'E2E test suite', 'Coverage report', 'Regression tests'],
  'docs-writer':   ['Writing API docs', 'Updating README', 'Creating diagrams', 'Changelog update'],
  'researcher':    ['Researching libs', 'Benchmarking tools', 'Web search', 'Analyzing options'],
};

export const AGENT_DEFINITIONS = [
  {
    id: 'orchestrator',
    name: 'Orchestrator',
    emoji: '🎯',
    color: '#818cf8',
    colorDark: '#4f46e5',
    isOrchestrator: true,
    // Orchestrator always stays at their command center
    stationPos:   { x: 505, y: 38 },
    breakRoomPos: { x: 505, y: 38 },
    stationLabel: 'Command Center',
  },
  {
    id: 'code-writer',
    name: 'Code Writer',
    emoji: '💻',
    color: '#4ade80',
    colorDark: '#16a34a',
    stationPos:   { x: 260, y: 225 },
    breakRoomPos: { x: 20,  y: 315 },
    stationLabel: 'Code Station',
  },
  {
    id: 'reviewer',
    name: 'Reviewer',
    emoji: '🔍',
    color: '#fb923c',
    colorDark: '#ea580c',
    stationPos:   { x: 480, y: 225 },
    breakRoomPos: { x: 90,  y: 350 },
    stationLabel: 'Review Desk',
  },
  {
    id: 'test-runner',
    name: 'Test Runner',
    emoji: '🧪',
    color: '#f87171',
    colorDark: '#dc2626',
    stationPos:   { x: 700, y: 225 },
    breakRoomPos: { x: 145, y: 315 },
    stationLabel: 'Test Lab',
  },
  {
    id: 'docs-writer',
    name: 'Docs Writer',
    emoji: '📝',
    color: '#60a5fa',
    colorDark: '#2563eb',
    stationPos:   { x: 260, y: 450 },
    breakRoomPos: { x: 20,  y: 450 },
    stationLabel: 'Docs Station',
  },
  {
    id: 'researcher',
    name: 'Researcher',
    emoji: '🔬',
    color: '#c084fc',
    colorDark: '#9333ea',
    stationPos:   { x: 480, y: 450 },
    breakRoomPos: { x: 110, y: 450 },
    stationLabel: 'Research Desk',
  },
];

export function createInitialAgents() {
  return AGENT_DEFINITIONS.map((def) => ({
    ...def,
    status: 'idle',          // idle | walking-to-work | working | walking-to-break
    currentTask: null,
    facing: 'right',
  }));
}
