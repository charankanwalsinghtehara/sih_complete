function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
  tone = "blue"
}) {
  return (
    <button
      className="quick-action"
      onClick={onClick}
    >
      <span
        className={`quick-action-icon quick-${tone}`}
      >
        <Icon size={20} />
      </span>

      <span className="quick-action-copy">
        <strong>
          {title}
        </strong>

        <small>
          {description}
        </small>
      </span>

      <span className="quick-action-arrow">
        →
      </span>
    </button>
  );
}

export default QuickAction;