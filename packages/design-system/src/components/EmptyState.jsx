export function EmptyState({ title, description, action, icon }) {
  return (
    <div className="text-center py-16 px-6">
      {icon && (
        <div className="inline-flex items-center justify-center w-12 h-12 mb-4 rounded-card bg-ink-50 text-ink-300 text-xl">
          {icon}
        </div>
      )}
      {title && (
        <div className="font-display font-semibold text-ink-700 text-base mb-2">
          {title}
        </div>
      )}
      {description && (
        <div className="text-sm text-ink-400 max-w-md mx-auto">{description}</div>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
