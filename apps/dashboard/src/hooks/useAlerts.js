import useDashboardStore from '../stores/dashboardStore';
import { isActiveAnomaly } from '../utils/calculations';

export function useAlerts() {
  const anomalias = useDashboardStore((state) => state.anomalias);
  return anomalias.filter(isActiveAnomaly);
}

