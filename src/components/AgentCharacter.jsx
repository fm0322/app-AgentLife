import './AgentCharacter.css';

// Walk transition duration (ms) – must match CSS --walk-ms default.
const WALK_MS = 2400;

/**
 * Get the target pixel position (top-left of the agent div) based on status.
 * Orchestrator never moves so always returns stationPos.
 */
function getPosition(agent) {
  if (agent.isOrchestrator) return agent.stationPos;
  switch (agent.status) {
    case 'walking-to-work':
    case 'working':
      return agent.stationPos;
    default:
      return agent.breakRoomPos;
  }
}

export default function AgentCharacter({ agent, onArrivedAtStation, onArrivedAtBreak }) {
  const pos = getPosition(agent);
  const isWalking = agent.status === 'walking-to-work' || agent.status === 'walking-to-break';
  const isWorking = agent.status === 'working';
  const isIdle    = agent.status === 'idle';
  const facingLeft = agent.facing === 'left';

  function handleTransitionEnd(e) {
    // Only react to the 'left' transition to avoid double-firing (left + top both transition)
    if (e.propertyName !== 'left') return;
    if (agent.status === 'walking-to-work')  onArrivedAtStation(agent.id);
    if (agent.status === 'walking-to-break') onArrivedAtBreak(agent.id);
  }

  const spriteClass = [
    'agent__sprite',
    isWalking  ? 'agent__sprite--walking' : '',
    isWorking  ? 'agent__sprite--working' : '',
    isIdle && !agent.isOrchestrator ? 'agent__sprite--idle' : '',
    agent.isOrchestrator ? 'agent__sprite--orchestrator' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={['agent', `agent--${agent.status}`, agent.isOrchestrator ? 'agent--orchestrator' : ''].join(' ')}
      style={{
        left: pos.x,
        top:  pos.y,
        '--color':      agent.color,
        '--color-dark': agent.colorDark,
        '--walk-ms':    `${WALK_MS}ms`,
        transform: facingLeft ? 'scaleX(-1)' : 'scaleX(1)',
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {/* Label – un-flip text when character walks left */}
      <div className="agent__label" style={{ transform: facingLeft ? 'scaleX(-1)' : undefined }}>
        <span className="agent__emoji">{agent.emoji}</span>
        {agent.name}
        {isWorking && agent.currentTask && (
          <span className="agent__task-badge">{agent.currentTask}</span>
        )}
      </div>

      {/* SVG character body */}
      <svg
        className={spriteClass}
        viewBox="0 0 34 70"
        width="40"
        height="75"
        aria-label={agent.name}
      >
        {/* Shadow */}
        <ellipse cx="17" cy="68" rx="11" ry="3.5" fill="rgba(0,0,0,0.18)" />

        {/* Legs */}
        <rect className="ll" x="10" y="40" width="7"  height="22" rx="3.5" fill="var(--color)" />
        <rect className="rl" x="17" y="40" width="7"  height="22" rx="3.5" fill="var(--color)" />

        {/* Body */}
        <rect x="8" y="22" width="18" height="20" rx="5" fill="var(--color)" />

        {/* Arms */}
        <rect className="la" x="1"  y="24" width="7" height="16" rx="3" fill="var(--color)" />
        <rect className="ra" x="26" y="24" width="7" height="16" rx="3" fill="var(--color)" />

        {/* Head */}
        <circle cx="17" cy="13" r="12" fill="var(--color)" />

        {/* Eyes */}
        <circle cx="13" cy="11" r="2.8" fill="white" />
        <circle cx="21" cy="11" r="2.8" fill="white" />
        <circle cx="13.6" cy="11.5" r="1.4" fill="#1e293b" />
        <circle cx="21.6" cy="11.5" r="1.4" fill="#1e293b" />

        {/* Smile */}
        <path d="M 11.5 16.5 Q 17 21 22.5 16.5" stroke="#1e293b" strokeWidth="1.6" fill="none" strokeLinecap="round" />

        {/* Orchestrator crown badge */}
        {agent.isOrchestrator && (
          <g transform="translate(17, -1) scale(0.55)">
            <polygon
              points="0,-9 2.5,-3 9,-3 4,1 6,8 0,4 -6,8 -4,1 -9,-3 -2.5,-3"
              fill="#fbbf24"
              stroke="#d97706"
              strokeWidth="0.8"
            />
          </g>
        )}
      </svg>

      {/* Dispatch pulse ring for orchestrator */}
      {agent.isOrchestrator && (
        <div className="agent__dispatch-pulse" />
      )}
    </div>
  );
}
