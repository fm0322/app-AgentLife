import './ActivityLog.css';

export default function ActivityLog({ events }) {
  if (!events || events.length === 0) {
    return (
      <div className="activity-log activity-log--empty">
        <span>📋</span> No activity yet — dispatch an agent to get started
      </div>
    );
  }

  return (
    <div className="activity-log">
      <div className="activity-log__title">📋 Activity Log</div>
      <ul className="activity-log__list">
        {events.map((ev) => (
          <li key={ev.id} className={`activity-log__item activity-log__item--${ev.type}`}>
            <span className="activity-log__time">{ev.time}</span>
            <span className="activity-log__icon">{ev.icon}</span>
            <span className="activity-log__message">{ev.message}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
