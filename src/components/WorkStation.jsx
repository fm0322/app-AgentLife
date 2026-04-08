import './WorkStation.css';

export default function WorkStation({ agent }) {
  if (!agent) return null;
  const pos = agent.stationPos;

  return (
    <div
      className={`workstation ${agent.status === 'working' ? 'workstation--active' : ''} ${agent.isOrchestrator ? 'workstation--orchestrator' : ''}`}
      style={{
        left: pos.x - 30,
        top: pos.y + 78,
        '--color': agent.color,
        '--color-dark': agent.colorDark,
      }}
    >
      <div className="workstation__desk">
        {/* Monitor */}
        <div className="workstation__monitor">
          <div className="workstation__screen">
            {agent.status === 'working' ? (
              <div className="workstation__code-lines">
                <span /><span /><span /><span /><span />
              </div>
            ) : (
              <div className="workstation__screen-off" />
            )}
          </div>
          <div className="workstation__stand" />
        </div>
        {/* Keyboard */}
        <div className="workstation__keyboard" />
      </div>
      <div className="workstation__label">
        <span className="workstation__label-emoji">{agent.emoji}</span>
        {agent.stationLabel}
      </div>
    </div>
  );
}
