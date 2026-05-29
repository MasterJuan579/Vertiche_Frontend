import React from 'react';
import { Card, CardHeader, CardBody } from '@vertiche/design-system';

export function Anomalias() {
  return (
    <div className="space-y-6 bg-transparent text-ink-700 dark:text-ink-50">
      {/* Encabezado de sección */}
      <div>
        <div className="label-industrial text-ink-400 dark:text-ink-300">Calidad Operativa</div>
        <h1 className="text-2xl font-display font-bold text-ink-700 dark:text-white mt-1">
          Anomalías
        </h1>
      </div>

      {/* Bloques de Tarjetas */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader label="Sin Resolver">
            <span className="tabular text-2xl font-bold">--</span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-ink-400 dark:text-ink-300">
              No hay anomalías críticas pendientes en este turno.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader label="Resueltas">
            <span className="tabular text-2xl font-bold">--</span>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-ink-400 dark:text-ink-300">
              Historial limpio.
            </p>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}