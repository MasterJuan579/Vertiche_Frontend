import useDashboardStore from '../stores/dashboardStore';

export function useModal() {
  return {
    modalOpen: useDashboardStore((state) => state.modalOpen),
    modalKey: useDashboardStore((state) => state.modalKey),
    openModal: useDashboardStore((state) => state.openModal),
    closeModal: useDashboardStore((state) => state.closeModal),
  };
}

