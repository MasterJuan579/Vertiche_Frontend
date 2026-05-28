import { useCallback, useEffect } from 'react';
import useDashboardStore from '../stores/dashboardStore';
import { api, ENDPOINTS } from '../services/api';

export function useDashboardData(refreshInterval = 30000) {
  const setData = useDashboardStore((state) => state.setData);
  const setError = useDashboardStore((state) => state.setError);
  const setLoading = useDashboardStore((state) => state.setLoading);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        tags,
        palets,
        pedidos,
        inspecciones,
        anomalias,
        eventos,
        cajas,
        tiendas,
        proveedores,
      ] = await Promise.all([
        api.get(ENDPOINTS.tags),
        api.get(ENDPOINTS.palets),
        api.get(ENDPOINTS.pedidos),
        api.get(ENDPOINTS.inspecciones),
        api.get(ENDPOINTS.anomalias),
        api.get(ENDPOINTS.eventos),
        api.get(ENDPOINTS.cajas),
        api.get(ENDPOINTS.tiendas),
        api.get(ENDPOINTS.proveedores),
      ]);

      setData({
        tags,
        palets,
        pedidos,
        inspecciones,
        anomalias,
        eventos,
        cajas,
        tiendas,
        proveedores,
      });
    } catch (err) {
      setError(err.message);
    }
  }, [setData, setError, setLoading]);

  useEffect(() => {
    loadAllData();
    const interval = setInterval(loadAllData, refreshInterval);
    return () => clearInterval(interval);
  }, [loadAllData, refreshInterval]);

  return { refresh: loadAllData };
}

