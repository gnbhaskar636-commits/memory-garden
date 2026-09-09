import type { MemoryWorldMemory } from "@/lib/world/world-types";

/**
 * Premium Frosted-Glass Memory Detail Panel
 * Displays photo, title, emotional breakdown, sentiment, tags, and date.
 */
export function MemoryDetailPanel({
  memory,
  onClose,
}: {
  memory: MemoryWorldMemory;
  onClose: () => void;
}) {
  return (
    <div className="mw-panel-backdrop" onClick={onClose} role="presentation">
      <aside
        className="mw-panel"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={memory.title}
      >
        <button
          type="button"
          className="mw-panel-close"
          onClick={onClose}
          aria-label="Close panel"
        >
          ✕
        </button>

        {memory.photo ? (
          <div className="mw-panel-photo-wrap">
            <img src={memory.photo} alt={memory.title} className="mw-panel-photo" />
            <div className="mw-panel-photo-glow" />
          </div>
        ) : (
          <div className="mw-panel-photo-empty">
            <span>🌱</span>
          </div>
        )}

        <div className="mw-panel-header">
          <h2>{memory.title}</h2>
          {memory.favorite && <span className="mw-panel-fav-badge">★ Favorite</span>}
        </div>

        {memory.description ? (
          <p className="mw-panel-desc">{memory.description}</p>
        ) : null}

        <dl className="mw-panel-meta">
          {memory.date ? (
            <div className="mw-panel-meta-item">
              <dt>Planted On</dt>
              <dd>{memory.date}</dd>
            </div>
          ) : null}

          {memory.primaryEmotion ? (
            <div className="mw-panel-meta-item">
              <dt>Primary Emotion</dt>
              <dd className="mw-panel-emotion">
                {memory.primaryEmotion}
                {memory.secondaryEmotion ? ` · ${memory.secondaryEmotion}` : ""}
              </dd>
            </div>
          ) : memory.mood ? (
            <div className="mw-panel-meta-item">
              <dt>Mood</dt>
              <dd>{memory.mood}</dd>
            </div>
          ) : null}

          {memory.sentiment ? (
            <div className="mw-panel-meta-item">
              <dt>Sentiment</dt>
              <dd className={`mw-panel-sentiment mw-sentiment-${memory.sentiment.toLowerCase()}`}>
                {memory.sentiment}
              </dd>
            </div>
          ) : null}

          {memory.tags && memory.tags.length > 0 ? (
            <div className="mw-panel-meta-item mw-panel-tags-row">
              <dt>Themes</dt>
              <dd className="mw-panel-tags">
                {memory.tags.map((tag, i) => (
                  <span key={i} className="mw-panel-tag">
                    #{tag}
                  </span>
                ))}
              </dd>
            </div>
          ) : null}
        </dl>
      </aside>
    </div>
  );
}
