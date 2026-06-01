import { useCallback, useEffect, useRef } from 'react';
import useDashboardStore from '../stores/dashboardStore';
import { api, ENDPOINTS } from '../services/api';

const KEYS = Object.keys(ENDPOINTS);
const ENTRIES = Object.entries(ENDPOINTS);

export function useDashboardData(refreshInterval = 30000) {
  const setData = useDashboardStore((state) => state.setData);
  const setError = useDashboardStore((state) => state.setError);
  const setLoading = useDashboardStore((state) => state.setLoading);
  const setRefreshing = useDashboardStore((state) => state.setRefreshing);
  const requestSeq = useRef(0);

  const loadAllData = useCallback(async (initial = false) => {
    const currentRequest = requestSeq.current + 1;
    requestSeq.current = currentRequest;

    if (initial) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const results = await Promise.allSettled(
      ENTRIES.map(([, endpoint]) => api.get(endpoint)),
    );

    if (requestSeq.current !== currentRequest) {
      return;
    }

    const data = {};
    const errors = {};
    let anySuccess = false;

    results.forEach((result, idx) => {
      const key = KEYS[idx];
      if (result.status === 'fulfilled') {
        data[key] = result.value;
        anySuccess = true;
      } else {
        data[key] = [];
        errors[key] = result.reason;
        // eslint-disable-next-line no-console
        console.warn(`[dashboard] Fallo al cargar ${key}:`, result.reason);
      }
    });

    if (anySuccess) {
      setData({ ...data, errors });
    } else {
      const first = Object.values(errors)[0];
      setError(first?.message || 'No se pudo cargar ningún dato del servidor');
    }
  }, [setData, setError, setLoading, setRefreshing]);

  useEffect(() => {
    loadAllData(true);
    const interval = setInterval(loadAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [loadAllData, refreshInterval]);

  return { refresh: () => loadAllData(false) };
}
