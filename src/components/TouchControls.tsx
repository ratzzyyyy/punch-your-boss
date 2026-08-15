import './TouchControls.css';

interface TouchControlsProps {
  onLeftPunch: () => void;
  onRightPunch: () => void;
}

// Plain props, no refs — and that's the point of contrast worth noticing.
// These onClick handlers are attached fresh by React on every render, so
// they always call whatever version of the punch handler currently
// exists. The ref-mirroring trick used for our keyboard listener is only
// needed for listeners set up ONCE and left running in the background
// (window.addEventListener inside a "run once" effect) — ordinary JSX
// event handlers never have that staleness problem to begin with.
function TouchControls({ onLeftPunch, onRightPunch }: TouchControlsProps) {
  return (
    <div className="touch-controls">
      <button type="button" className="touch-punch-button left" onClick={onLeftPunch}>
        LEFT
      </button>
      <button type="button" className="touch-punch-button right" onClick={onRightPunch}>
        RIGHT
      </button>
    </div>
  );
}

export default TouchControls;