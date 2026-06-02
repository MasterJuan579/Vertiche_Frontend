import { useEffect, useMemo, useState } from 'react';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AppShell, useAuth } from '@vertiche/design-system';
import { SorterScreen } from './pages/SorterScreen.jsx';
import { CajaSorterScreen } from './pages/CajaSorterScreen.jsx';
import { BahiasList } from './pages/BahiasList.jsx';
import { BayScreen } from './pages/BayScreen.jsx';
import { OperatorScreen } from './pages/OperatorScreen.jsx';
import { CAJA_COUNT } from './data/demoData.js';
import { listTagsCompletos } from './api/tags.js';
import { listTiendas } from './api/tiendas.js';

const ACCENT = '#7C3AED';

const BASE_NAV = [
  { to: '/sorter',          label: 'Sorter -> Bahia', end: true },
  { to: '/sorter/cajas',    label: 'Arco -> Caja' },
  { to: '/sorter/bahias',   label: 'Bahias' },
];

export function SorterModule() {
  const { session, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeBays, setActiveBays] = useState([1]);
  const [selectedBay, setSelectedBay] = useState(1);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listTiendas(), listTagsCompletos()])
      .then(([tiendas, tags]) => {
        if (cancelled) return;
        const bays = new Set([1]);
        for (const tienda of Array.isArray(tiendas) ? tiendas : []) {
          const bay = parseBahia(tienda.bahia_asignada);
          if (bay) bays.add(bay);
        }
        for (const tag of Array.isArray(tags) ? tags : []) {
          const bay = parseBahia(tag.tienda?.bahia_asignada);
          if (bay) bays.add(bay);
        }
        setActiveBays([...bays].sort((a, b) => a - b));
      })
      .catch(() => {
        if (!cancelled) setActiveBays([1]);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const match = location.pathname.match(/BAHIA-(\d+)/i);
    if (!match) return;
    const routeBay = Number(match[1]);
    if (Number.isFinite(routeBay) && routeBay >= 1) {
      setSelectedBay(routeBay);
    }
  }, [location.pathname]);

  const navItems = useMemo(() => {
    const boxes = Array.from({ length: CAJA_COUNT }, (_, i) => i + 1).map((box) => ({
      to: `/sorter/caja/BAHIA-${selectedBay}-CAJA-${box}`,
      label: `Caja ${box}`,
    }));

    return [
      ...BASE_NAV,
      {
        type: 'select',
        key: 'bahia-selector',
        label: 'Bahia',
        value: selectedBay,
        options: activeBays.map((bay) => ({ value: bay, label: `Bahia ${bay}` })),
        onChange: (value) => {
          const nextBay = Number(value);
          if (!Number.isFinite(nextBay)) return;
          setSelectedBay(nextBay);

          if (location.pathname.startsWith('/sorter/caja/')) {
            const currentBox = parseCajaNumber(location.pathname) || 1;
            navigate(`/sorter/caja/BAHIA-${nextBay}-CAJA-${currentBox}`);
          }
        },
      },
      ...boxes,
    ];
  }, [activeBays, location.pathname, navigate, selectedBay]);

  return (
    <AppShell
      moduleName="Flujo CEDIS"
      moduleAccent={ACCENT}
      navItems={navItems}
      user={{ name: session.user.nombre, role: 'Operacion Bahia' }}
      onLogout={signOut}
    >
      <Routes>
        {/* Default — live scanner view */}
        <Route path="/" element={<SorterScreen />} />
        <Route path="cajas" element={<CajaSorterScreen />} />

        {/* Bay directory */}
        <Route path="bahias" element={<BahiasList />} />

        {/* Per-bay detail. BayScreen redirects to /sorter/bahias if the ID
            is bad (non-numeric or out of range). */}
        <Route path="bahia/:id" element={<BayScreen />} />

        {/* Per-box operator screens. Old /operador route remains as an alias. */}
        <Route path="caja/:id" element={<OperatorScreen />} />
        <Route path="operador/:id" element={<OperatorScreen />} />

        {/* Anything else bounces to the scanner */}
        <Route path="*" element={<Navigate to="/sorter" replace />} />
      </Routes>
    </AppShell>
  );
}

function parseBahia(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/BAHIA-(\d+)|\b(\d+)\b/i);
  if (!match) return null;
  const n = Number(match[1] || match[2]);
  return Number.isFinite(n) && n >= 1 ? n : null;
}

function parseCajaNumber(value) {
  if (typeof value !== 'string') return null;
  const cajaMatch = value.match(/CAJA-(\d+)/i);
  if (cajaMatch) return Number(cajaMatch[1]);
  const compactMatch = value.match(/\bC(\d+)\b/i);
  if (compactMatch) return Number(compactMatch[1]);
  const numberMatch = value.match(/\b(\d+)\b/);
  return numberMatch ? Number(numberMatch[1]) : null;
}
