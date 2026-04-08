import './ControlPanel.css';

export default function ControlPanel({ agents, onDispatch, onDispatchAll }) {
  const subAgents = agents.filter((a) => !a.isOrchestrator);

  const statusLabel = {
    idle: 'Idle',
    'walking-to-work': 'Walking ↗',
    working: 'Working ⚡',
    'walking-to-break': 'Returning ↙',
  };

  const statusClass = {
    idle: 'cp-badge--idle',
    'walking-to-work': 'cp-badge--walking',
    working: 'cp-badge--working',
    'walking-to-break': 'cp-badge--returning',
  };

  return (
    <div className="control-panel">
      <div className="cp-title">
        <span>🎛️</span> Orchestrator Control Panel
      </div>

      <div className="cp-agents">
        {subAgents.map((agent) => (
          <div key={agent.id} className="cp-agent-row">
            <div className="cp-agent-info">
              <span className="cp-agent-emoji">{agent.emoji}</span>
              <span className="cp-agent-name" style={{ color: agent.colorDark }}>{agent.name}</span>
              <span
                className={`cp-badge ${statusClass[agent.status] || ''}`}
              >
                {statusLabel[agent.status] || agent.status}
              </span>
              {agent.currentTask && (
                <span className="cp-task">{agent.currentTask}</span>
              )}
            </div>
            <button
              className="cp-dispatch-btn"
              style={{ '--btn-color': agent.color, '--btn-dark': agent.colorDark }}
              onClick={() => onDispatch(agent.id)}
              disabled={agent.status !== 'idle'}
            >
              Dispatch
            </button>
          </div>
        ))}
      </div>

      <div className="cp-footer">
        <button className="cp-dispatch-all-btn" onClick={onDispatchAll}>
          🚀 Dispatch All Idle Agents
        </button>
        <p className="cp-hint">
          Agents walk to their station, work for a bit, then return to the break room.
        </p>
      </div>
    </div>
  );
}
