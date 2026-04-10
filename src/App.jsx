import { useCallback, useEffect, useRef, useState } from 'react';
import { useAgentState } from './hooks/useAgentState';
import AgentCharacter from './components/AgentCharacter';
import WorkStation from './components/WorkStation';
import BreakRoom from './components/BreakRoom';
import ControlPanel from './components/ControlPanel';
import ActivityLog from './components/ActivityLog';
import './App.css';

export default function App() {
  const MAX_PATH_DISPLAY_LENGTH = 48;
  const {
    agents,
    events,
    copilotState,
    dispatchAgent,
    dispatchAll,
    onArrivedAtStation,
    onArrivedAtBreak,
    ingestCopilotEntry,
    finalizeCopilotSession,
  } =
    useAgentState();

  const [autoSim, setAutoSim] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [logDirectoryHandle, setLogDirectoryHandle] = useState(null);
  const [trackedLogFileName, setTrackedLogFileName] = useState('');
  const [streamError, setStreamError] = useState('');
  const pollIntervalMs = 1000;
  const autoTimerRef = useRef(null);
  const tailTimerRef = useRef(null);
  const tailStateRef = useRef({ offset: 0, buffer: '' });
  const fileHandleRef = useRef(null);

  const formatTrackedPath = (path) => {
    if (!path) return 'Not configured';
    if (path.length <= MAX_PATH_DISPLAY_LENGTH) return path;
    const parts = path.split('/');
    if (parts.length >= 2) return `…/${parts.slice(-2).join('/')}`;
    return `…${path.slice(-MAX_PATH_DISPLAY_LENGTH)}`;
  };

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

  const stopTailing = useCallback((finalize = true) => {
    if (tailTimerRef.current) {
      clearInterval(tailTimerRef.current);
      tailTimerRef.current = null;
    }
    setIsStreaming(false);
    if (finalize) finalizeCopilotSession();
  }, [finalizeCopilotSession]);

  useEffect(() => () => stopTailing(false), [stopTailing]);

  const pickLatestProcessLogFile = useCallback(async (directoryHandle) => {
    let latest = null;
    const pattern = /^process-\d+(?:-\d+)?\.log$/i;
    for await (const [name, handle] of directoryHandle.entries()) {
      if (handle.kind !== 'file' || !pattern.test(name)) continue;
      const file = await handle.getFile();
      if (!latest || file.lastModified > latest.lastModified) {
        latest = { name, handle, lastModified: file.lastModified };
      }
    }
    return latest;
  }, []);

  const configureLogDirectory = useCallback(async () => {
    setStreamError('');
    if (!window.showDirectoryPicker) {
      setStreamError('Directory picker requires a Chromium-based browser (Chrome, Edge, etc.).');
      return;
    }
    const directory = await window.showDirectoryPicker({ mode: 'read' });
    setLogDirectoryHandle(directory);
  }, []);

  const startTailing = useCallback(async () => {
    setStreamError('');
    let directory = logDirectoryHandle;

    if (!directory && window.showDirectoryPicker) {
      directory = await window.showDirectoryPicker({ mode: 'read' });
      setLogDirectoryHandle(directory);
    }

    if (!directory) {
      setStreamError('Select a log directory first.');
      return;
    }

    const latest = await pickLatestProcessLogFile(directory);
    if (!latest) {
      setStreamError('No process log found. Expected files matching process-*.log in the selected directory. Select the parent folder containing those log files.');
      return;
    }

    fileHandleRef.current = latest.handle;
    setTrackedLogFileName(`${directory.name}/${latest.name}`);
    tailStateRef.current = { offset: 0, buffer: '' };
    setAutoSim(false);
    setIsStreaming(true);

    const readTick = async () => {
      try {
        const activeFile = await fileHandleRef.current.getFile();
        const text = await activeFile.text();

        // Handle file truncation where the file shrinks between polls.
        // Only the tail cursor resets; lifecycle state is preserved to continue streaming in place.
        if (text.length < tailStateRef.current.offset) {
          tailStateRef.current = { offset: 0, buffer: '' };
        }

        const chunk = text.slice(tailStateRef.current.offset);
        tailStateRef.current.offset = text.length;
        if (!chunk) return;

        const combined = tailStateRef.current.buffer + chunk;
        const lines = combined.split(/\r?\n/);
        tailStateRef.current.buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            ingestCopilotEntry(JSON.parse(trimmed));
          } catch {
            // ignore malformed lines
          }
        }
      } catch (error) {
        const details = error instanceof Error ? error.message : String(error || 'unknown error');
        setStreamError(`Failed reading log file: ${details}`);
        stopTailing();
      }
    };

    await readTick();
    if (tailTimerRef.current) clearInterval(tailTimerRef.current);
    tailTimerRef.current = setInterval(readTick, pollIntervalMs);
  }, [ingestCopilotEntry, logDirectoryHandle, pickLatestProcessLogFile, stopTailing]);

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="app-header__logo">
          <span className="app-header__icon">��</span>
          <span>GitHub Copilot Agent Office</span>
        </div>
        <div className="app-header__controls">
          <button className="app-header__btn" onClick={configureLogDirectory}>
            📁 Configure Log Path
          </button>
          {!isStreaming ? (
            <button className="app-header__btn app-header__btn--primary" onClick={startTailing}>
              ▶ Start Copilot Stream
            </button>
          ) : (
            <button className="app-header__btn app-header__btn--danger" onClick={() => stopTailing(true)}>
              ■ Stop Copilot Stream
            </button>
          )}
          <label className="auto-sim-toggle">
            <input
              type="checkbox"
              checked={autoSim}
              disabled={isStreaming}
              title={isStreaming ? 'Disabled during Copilot stream' : undefined}
              onChange={(e) => setAutoSim(e.target.checked)}
            />
            <span className="auto-sim-toggle__track">
              <span className="auto-sim-toggle__thumb" />
            </span>
            <span className="auto-sim-toggle__label">
              {autoSim ? '⚡ Auto-sim ON' : 'Auto-sim'}
            </span>
          </label>
          <div className="app-header__status">
            <span title={trackedLogFileName} aria-label={trackedLogFileName ? `Log file path ${trackedLogFileName}` : 'Log file path not configured'}>
              Log: {formatTrackedPath(trackedLogFileName)}
            </span>
            <span>
              Session: {copilotState.status}
              {copilotState.currentAgent ? ` (${copilotState.currentAgent})` : ''}
            </span>
          </div>
          <div className="app-header__sub">Visualize your AI agents at work</div>
          {streamError ? <div className="app-header__error">{streamError}</div> : null}
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
