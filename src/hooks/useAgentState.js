import { useReducer, useCallback, useRef, useState } from 'react';
import { createInitialAgents, TASKS } from '../data/agents';

let eventCounter = 0;
const NON_AGENT_ROLES = new Set(['assistant', 'user', 'system', 'tool']);

function pickTask(agentId) {
  const pool = TASKS[agentId] || ['Working...'];
  return pool[Math.floor(Math.random() * pool.length)];
}

function now() {
  return new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function getCurrentIsoTimestamp() {
  return new Date().toISOString();
}

function normalizeAgentId(value) {
  if (!value || typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/[_\s]+/g, '-');
}

function resolveSkillAgent(toolCalls) {
  if (!Array.isArray(toolCalls)) return null;
  for (const toolCall of toolCalls) {
    if (toolCall?.function?.name !== 'skill') continue;
    const rawArguments = toolCall?.function?.arguments;
    if (!rawArguments || typeof rawArguments !== 'string') continue;
    try {
      const parsed = JSON.parse(rawArguments);
      if (typeof parsed?.skill === 'string' && parsed.skill.trim()) return parsed.skill.trim();
    } catch {
      // ignore malformed tool args
    }
  }
  return null;
}

function resolveActiveAgent(message, previousAgent) {
  const role = typeof message?.role === 'string' ? message.role.trim() : '';
  if (role && !NON_AGENT_ROLES.has(role.toLowerCase())) return role;
  return resolveSkillAgent(message?.tool_calls) || previousAgent || null;
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
    case 'LOG_WORKING': {
      const { agentId, task } = action;
      return state.map((a) => {
        if (a.isOrchestrator) return a;
        if (a.id === agentId) {
          return { ...a, status: 'working', currentTask: task || a.currentTask || 'Working from Copilot log', facing: 'right' };
        }
        if (a.status !== 'idle') return { ...a, status: 'idle', currentTask: null, facing: 'left' };
        return a;
      });
    }
    case 'LOG_IDLE':
      return state.map((a) =>
        a.id === action.agentId ? { ...a, status: 'idle', currentTask: null, facing: 'left' } : a
      );
    case 'LOG_IDLE_ALL':
      return state.map((a) =>
        a.isOrchestrator ? a : { ...a, status: 'idle', currentTask: null, facing: 'left' }
      );
    default:
      return state;
  }
}

export function useAgentState() {
  const [agents, dispatch] = useReducer(agentsReducer, null, createInitialAgents);
  const [events, setEvents] = useState([]);
  const [copilotState, setCopilotState] = useState({
    currentAgent: null,
    status: 'idle',
    lastIndex: null,
    startedAt: null,
    lastUpdatedAt: null,
  });
  const workTimers = useRef({});
  const lifecycleRef = useRef({
    currentAgent: null,
    status: 'idle',
    lastIndex: null,
    startedAt: null,
    lastUpdatedAt: null,
  });

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
  }, [agents]);

  const dispatchAll = useCallback(() => {
    const idle = agents.filter((a) => !a.isOrchestrator && a.status === 'idle');
    if (idle.length === 0) return;
    dispatch({ type: 'DISPATCH_ALL' });
    addEvent('dispatch', '🚀', `Orchestrator dispatched ${idle.length} agent${idle.length > 1 ? 's' : ''}`);
  }, [agents]);

  const onArrivedAtStation = useCallback((agentId) => {
    dispatch({ type: 'ARRIVED_AT_STATION', agentId });
    const agent = agents.find((a) => a.id === agentId);
    if (agent) addEvent('working', '⚡', `${agent.name} started: ${agent.currentTask || 'working'}`);
    const duration = 4000 + Math.random() * 4000;
    workTimers.current[agentId] = setTimeout(() => {
      dispatch({ type: 'DONE_WORKING', agentId });
    }, duration);
  }, [agents]);

  const onArrivedAtBreak = useCallback((agentId) => {
    dispatch({ type: 'ARRIVED_AT_BREAK', agentId });
    const agent = agents.find((a) => a.id === agentId);
    if (agent) addEvent('idle', agent.emoji, `${agent.name} returned to break room`);
  }, [agents]);

  const findKnownAgent = useCallback((resolvedAgent) => {
    const normalized = normalizeAgentId(resolvedAgent);
    return agents.find((a) =>
      a.id === normalized || a.name.toLowerCase() === String(resolvedAgent || '').toLowerCase()
    ) || null;
  }, [agents]);

  const updateSessionState = useCallback((nextPartial) => {
    const next = { ...lifecycleRef.current, ...nextPartial, lastUpdatedAt: getCurrentIsoTimestamp() };
    lifecycleRef.current = next;
    setCopilotState(next);
  }, []);

  const ingestCopilotEntry = useCallback((entry) => {
    if (!entry || typeof entry !== 'object' || !entry.message) return;
    const lastIndex = lifecycleRef.current.lastIndex;
    if (typeof entry.index === 'number' && typeof lastIndex === 'number' && entry.index <= lastIndex) return;

    const previousAgent = lifecycleRef.current.currentAgent;
    const resolvedAgent = resolveActiveAgent(entry.message, previousAgent);
    const knownAgent = findKnownAgent(resolvedAgent);
    const reason = typeof entry.finish_reason === 'string' ? entry.finish_reason : '';
    const refusal = entry?.message?.refusal;

    // A switch means we are handing off from one active agent to another.
    const isAgentSwitch = Boolean(
      previousAgent &&
      resolvedAgent &&
      normalizeAgentId(previousAgent) !== normalizeAgentId(resolvedAgent)
    );
    // A new start means the current entry should be treated as this agent's start event.
    const isNewAgentStart = Boolean(
      resolvedAgent &&
      normalizeAgentId(previousAgent) !== normalizeAgentId(resolvedAgent)
    );

    if (isAgentSwitch) {
      addEvent('handoff', '🔁', `Handoff: ${previousAgent} → ${resolvedAgent}`);
      addEvent('completed', '✅', `${previousAgent} marked done (handoff)`);
      const previousKnown = findKnownAgent(previousAgent);
      if (previousKnown) dispatch({ type: 'LOG_IDLE', agentId: previousKnown.id });
    }

    if (isNewAgentStart) {
      addEvent('started', '🚀', `${resolvedAgent} started`);
      if (knownAgent) {
        dispatch({
          type: 'LOG_WORKING',
          agentId: knownAgent.id,
          task: knownAgent.currentTask || `Processing log index ${entry.index ?? '?'}`,
        });
      }
      updateSessionState({
        currentAgent: resolvedAgent,
        status: 'working',
        startedAt: getCurrentIsoTimestamp(),
        lastIndex: typeof entry.index === 'number' ? entry.index : lifecycleRef.current.lastIndex,
      });
    } else if (resolvedAgent) {
      addEvent('working', '⚡', `${resolvedAgent} working (log index ${entry.index ?? '?'})`);
      if (knownAgent) {
        dispatch({
          type: 'LOG_WORKING',
          agentId: knownAgent.id,
          task: knownAgent.currentTask || `Processing log index ${entry.index ?? '?'}`,
        });
      }
      updateSessionState({
        currentAgent: resolvedAgent,
        status: 'working',
        lastIndex: typeof entry.index === 'number' ? entry.index : lifecycleRef.current.lastIndex,
      });
    } else {
      updateSessionState({
        lastIndex: typeof entry.index === 'number' ? entry.index : lifecycleRef.current.lastIndex,
      });
    }

    if (refusal || reason === 'error') {
      const failureSource = refusal || reason || 'unknown';
      addEvent('failed', '❌', `${resolvedAgent || previousAgent || 'Agent'} failed: ${failureSource}`);
      updateSessionState({
        status: 'failed',
        currentAgent: resolvedAgent || previousAgent || null,
      });
      if (knownAgent) dispatch({ type: 'LOG_IDLE', agentId: knownAgent.id });
      return;
    }

    if (reason === 'stop') {
      const completedAgent = resolvedAgent || previousAgent;
      if (completedAgent) {
        addEvent('completed', '✅', `${completedAgent} completed`);
        const completedKnown = findKnownAgent(completedAgent);
        if (completedKnown) dispatch({ type: 'LOG_IDLE', agentId: completedKnown.id });
      }
      updateSessionState({
        currentAgent: null,
        status: 'done',
        startedAt: null,
        lastIndex: typeof entry.index === 'number' ? entry.index : lifecycleRef.current.lastIndex,
      });
    }
  }, [findKnownAgent, updateSessionState]);

  const finalizeCopilotSession = useCallback(() => {
    const active = lifecycleRef.current.currentAgent;
    if (!active) {
      updateSessionState({ status: 'idle', lastUpdatedAt: getCurrentIsoTimestamp() });
      return;
    }
    addEvent('completed', '✅', `${active} completed (session ended)`);
    const knownAgent = findKnownAgent(active);
    if (knownAgent) dispatch({ type: 'LOG_IDLE', agentId: knownAgent.id });
    updateSessionState({
      currentAgent: null,
      status: 'done',
      startedAt: null,
      lastUpdatedAt: getCurrentIsoTimestamp(),
    });
  }, [findKnownAgent, updateSessionState]);

  return {
    agents,
    events,
    copilotState,
    dispatchAgent,
    dispatchAll,
    onArrivedAtStation,
    onArrivedAtBreak,
    ingestCopilotEntry,
    finalizeCopilotSession,
  };
}
