import { useCallback, useEffect, useRef, useState } from 'react';
import { useAgentState } from './hooks/useAgentState';
import AgentCharacter from './components/AgentCharacter';
import WorkStation from './components/WorkStation';
import BreakRoom from './components/BreakRoom';
import ControlPanel from './components/ControlPanel';
import ActivityLog from './components/ActivityLog';
import './App.css';

export default function App() {
  const { agents, events, dispatchAgent, dispatchAll, onArrivedAtStation, onArrivedAtBreak } =
    useAgentState();

  const [autoSim, setAutoSim] = useState(false);
  const autoTimerRef = useRef(null);

  const handleArrivedAtStation = useCallback(
    (id) => onArrivedAtStation(id),
    [onArrivedAtStation]
  );
  const handleArrivedAtBreak = useCallback(
    (id) => onArrivedAtBreak(id),
    [onArrivedAtBreak]
  );

  // Auto-simulation: periodically dispatch idle agents
  useEffect(() => {
    if (!autoSim) {
      clearInterval(autoTimerRef.current);
      return;
    }
    autoTimerRef.current = setInterval(() => {
      const idle = agents.filter((a) => !a.isOrchestrator && a.status === 'idle');
      if (idle.length > 0) {
        // dispatch a random idle agent
        const target = idle[Math.floor(Math.random() * idle.length)];
        dispatchAgent(target.id);
      }
    }, 3000);
    return () => clearInterval(autoTimerRef.current);
  }, [autoSim, agents, dispatchAgent]);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">
          <span className="app-header__icon">��</span>
          <span>GitHub Copilot Agent Office</span>
        </div>
        <div className="app-header__controls">
          <label className="auto-sim-toggle">
            <input
              type="checkbox"
              checked={autoSim}
              onChange={(e) => setAutoSim(e.target.checked)}
            />
            <span className="auto-sim-toggle__track">
              <span className="auto-sim-toggle__thumb" />
            </span>
            <span className="auto-sim-toggle__label">
              {autoSim ? '⚡ Auto-sim ON' : 'Auto-sim'}
            </span>
          </label>
          <div className="app-header__sub">Visualize your AI agents at work</div>
        </div>
      </header>

      {/* Office scene */}
      <div className="scene-wrapper">
        <div className="scene">
          <BreakRoom />

          <div className="work-area">
            <div className="work-area__label">🏢 Work Area</div>
            <div className="floor-grid" />
          </div>

          {/* Work stations in scene coordinate space */}
          {agents.map((agent) => (
            <WorkStation key={agent.id} agent={agent} />
          ))}

          {/* Agents in scene coordinate space */}
          {agents.map((agent) => (
            <AgentCharacter
              key={agent.id}
              agent={agent}
              onArrivedAtStation={handleArrivedAtStation}
              onArrivedAtBreak={handleArrivedAtBreak}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="legend">
          <span className="legend__item legend__item--idle">● Idle</span>
          <span className="legend__item legend__item--walking">● Walking</span>
          <span className="legend__item legend__item--working">● Working</span>
          <span className="legend__item legend__item--returning">● Returning</span>
        </div>
      </div>

      {/* Bottom: control panel + activity log */}
      <div className="bottom-row">
        <ControlPanel agents={agents} onDispatch={dispatchAgent} onDispatchAll={dispatchAll} />
        <ActivityLog events={events} />
      </div>
    </div>
  );
}
