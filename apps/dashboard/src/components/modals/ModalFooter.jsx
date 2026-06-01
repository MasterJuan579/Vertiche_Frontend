import ReportePDF from './ReportePDF';

export function ModalFooter({ etapa }) {
  return (
    <div className="border-t border-ink-100 dark:border-ink-600">
      <ReportePDF etapa={etapa} />
    </div>
  );
}
