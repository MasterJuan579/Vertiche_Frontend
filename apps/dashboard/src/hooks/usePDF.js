import { useCallback, useRef, useState } from 'react';
import { generarNombrePDF, generarPDF } from '../utils/pdfGenerator';

export function usePDF() {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useRef(null);

  const exportarPDF = useCallback(async (etapa = 'general') => {
    if (!contentRef.current) {
      setError('No hay contenido para exportar');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      const filename = generarNombrePDF(etapa);
      await generarPDF(contentRef.current, filename);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }, []);

  return { contentRef, exportarPDF, generating, error };
}

