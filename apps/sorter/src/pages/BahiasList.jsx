import React from 'react';
import { Card, CardBody } from '@vertiche/design-system';

export function BahiasList({ bahias = [], onSelectBahia }) {
  return (
    <div className="space-y-6 bg-transparent min-h-full">
      {/* Header de la vista */}
      <div>
        <h1 className="text-xl font-display font-bold text-ink-700 dark:text-white">
          Bahías del CEDIS
        </h1>
        <p className="text-sm text-ink-400 dark:text-ink-300 mt-1">
          10 bahías activas · selecciona una para ver sus estaciones y prepacks asignados
        </p>
      </div>

      {/* Grid de Bahías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bahias.map((bahia) => (
          <Card 
            key={bahia.id} 
            onClick={() => onSelectBahia?.(bahia.id)}
            className="hover:border-ink-200 dark:hover:border-ink-600 transition-all"
          >
            <CardBody className="flex flex-col h-full justify-between">
              <div className="flex items-start justify-between">
                {/* Badge de número con color dinámico */}
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-display font-bold text-lg"
                  style={{ backgroundColor: bahia.color || '#1e293b' }}
                >
                  {bahia.numero}
                </div>
                <span className="label-industrial text-ink-400 dark:text-ink-300">
                  Bahía {bahia.numero}
                </span>
              </div>

              <div className="mt-6">
                <span className="label-industrial text-ink-400 dark:text-ink-300 block mb-1">Destinos</span>
                <h3 className="font-display font-semibold text-ink-700 dark:text-white text-base truncate">
                  {bahia.destinos?.join(' · ') || 'Sin destinos'}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 border-t border-ink-50 dark:border-ink-700/50 pt-4">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-300 block">Tiendas</span>
                  <span className="text-lg font-bold tabular text-ink-700 dark:text-white">{bahia.tiendasCount || 0}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-300 block">Prepacks</span>
                  <span className="text-lg font-bold tabular" style={{ color: bahia.color }}>
                    {bahia.prepacksCount || 0}
                  </span>
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}