import ReportePDF from './ReportePDF';

export function ModalFooter({ etapa, children }) {
  return (
    <div className="border-t border-ink-100 dark:border-ink-600">
      <ReportePDF etapa={etapa}>{children}</ReportePDF>
    </div>
  );
}
