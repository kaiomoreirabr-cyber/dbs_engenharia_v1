export default function PageHeader({ icon: Icon, eyebrow, title, children }) {
  return (
    <div className="page-header">
      <div className="page-header-row">
        <span className="page-header-icon" aria-hidden="true">
          <Icon size={16} />
        </span>
        <span className="page-header-eyebrow">{eyebrow}</span>
      </div>
      <h1 className="page-header-title">{title}</h1>
      {children}
    </div>
  );
}
