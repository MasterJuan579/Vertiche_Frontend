import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { isActiveAnomaly } from '../utils/calculations';

const useDashboardStore = create(
  devtools(
    (set, get) => ({
      tags: [],
      palets: [],
      pedidos: [],
      inspecciones: [],
      anomalias: [],
      eventos: [],
      cajas: [],
      tiendas: [],
      proveedores: [],

      loading: true,
      error: null,
      errors: {},
      lastUpdate: null,
      drawerOpen: false,
      modalOpen: false,
      modalKey: null,

      setData: (data) =>
        set({ ...data, loading: false, error: null, lastUpdate: new Date() }),
      setError: (error) => set({ error, loading: false }),
      setLoading: (loading) => set({ loading }),

      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
      openModal: (key) => set({ modalOpen: true, modalKey: key }),
      closeModal: () => set({ modalOpen: false, modalKey: null }),

      getAnomaliasActivas: () => get().anomalias.filter(isActiveAnomaly),
      getTagsByEtapa: (etapa) =>
        get().tags.filter((t) => t.etapa_actual === etapa),
      getCajasByEstado: (estado) => get().cajas.filter((c) => c.estado === estado),
    }),
    { name: 'DashboardStore' },
  ),
);

export default useDashboardStore;
