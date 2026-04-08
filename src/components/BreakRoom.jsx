import './BreakRoom.css';

export default function BreakRoom() {
  return (
    <div className="breakroom">
      <div className="breakroom__sign">☕ Break Room</div>

      {/* Coffee machine */}
      <div className="breakroom__coffee-machine">
        <div className="breakroom__cm-body">
          <div className="breakroom__cm-screen" />
          <div className="breakroom__cm-spout" />
          <div className="breakroom__cm-cup" />
        </div>
        <div className="breakroom__cm-label">Coffee ☕</div>
      </div>

      {/* Couch */}
      <div className="breakroom__couch">
        <div className="breakroom__couch-back" />
        <div className="breakroom__couch-seat" />
        <div className="breakroom__couch-left-arm" />
        <div className="breakroom__couch-right-arm" />
      </div>

      {/* Small table */}
      <div className="breakroom__table">
        <div className="breakroom__table-top">🍩</div>
      </div>
    </div>
  );
}
