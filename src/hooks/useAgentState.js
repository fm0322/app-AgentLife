import { useReducer, useCallback, useRef, useState } from 'react';
import { createInitialAgents, TASKS } from '../data/agents';

let eventCounter = 0;

function pickTask(agentId) {
  const pool = TASKS[agentId] || ['Working...'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function agentsReducer(state, action) {
  switch (action.type) {
    case 'DISPATCH': {
      const { agentId } = action;
      return state.map((a) =>
        a.id === agentId && a.status === 'idle'
          ? { ...a, status: 'walking-to-work', currentTask: pickTask(agentId), facing: 'right' }
          : a
      );
    }
    case 'ARRIVED_AT_STATION':
      return state.map((a) =>
        a.id === action.agentId ? { ...a, status: 'working' } : a
      );
    case 'DONE_WORKING':
      return state.map((a) =>
        a.id === action.agentId ? { ...a, status: 'walking-to-break', facing: 'left' } : a
      );
    case 'ARRIVED_AT_BREAK':
      return state.map((a) =>
        a.id === action.agentId ? { ...a, status: 'idle', currentTask: null } : a
      );
    case 'DISPATCH_ALL':
      return state.map((a) =>
        a.isOrchestrator || a.status !== 'idle'
          ? a
          : { ...a, status: 'walking-to-work', currentTask: pickTask(a.id), facing: 'right' }
      );
    default:
      return state;
  }
}

export function useAgentState() {
  const [agents, dispatch] = useReducer(agentsReducer, null, createInitialAgents);
  const [events, setEvents] = useState([]);
  const workTimers = useRef({});

  function addEvent(type, icon, message) {
    setEvents((prev) => [
      { id: ++eventCounter, type, icon, message, time: now() },
      ...prev.slice(0, 19), // keep last 20
    ]);
  }

  const dispatchAgent = useCallback((agentId) => {
    const agent = agents.find((a) => a.id === agentId);
    if (!agent || agent.status !== 'idle') return;
    dispatch({ type: 'DISPATCH', agentId });
    addEvent('dispatch', agent.emoji, `${agent.name} dispatched to ${agent.stationLabel}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents]);

  const dispatchAll = useCallback(() => {
    const idle = agents.filter((a) => !a.isOrchestrator && a.status === 'idle');
    if (idle.length === 0) return;
    dispatch({ type: 'DISPATCH_ALL' });
    addEvent('dispatch', '🚀', `Orchestrator dispatched ${idle.length} agent${idle.length > 1 ? 's' : ''}`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents]);

  const onArrivedAtStation = useCallback((agentId) => {
    dispatch({ type: 'ARRIVED_AT_STATION', agentId });
    const agent = agents.find((a) => a.id === agentId);
    if (agent) addEvent('working', '⚡', `${agent.name} started: ${agent.currentTask || 'working'}`);
    const duration = 4000 + Math.random() * 4000;
    workTimers.current[agentId] = setTimeout(() => {
      dispatch({ type: 'DONE_WORKING', agentId });
    }, duration);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents]);

  const onArrivedAtBreak = useCallback((agentId) => {
    dispatch({ type: 'ARRIVED_AT_BREAK', agentId });
    const agent = agents.find((a) => a.id === agentId);
    if (agent) addEvent('idle', agent.emoji, `${agent.name} returned to break room`);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agents]);

  return { agents, events, dispatchAgent, dispatchAll, onArrivedAtStation, onArrivedAtBreak };
}
