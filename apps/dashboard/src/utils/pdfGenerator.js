export async function generarPDF(element, filename = 'reporte-vertiche.pdf', options = {}) {
  const {
    orientation = 'portrait',
    unit = 'mm',
    format = 'a4',
    scale = 2,
    quality = 0.95,
  } = options;

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale,
    useCORS: true,
    allowTaint: true,
    backgroundColor: '#ffffff',
    logging: false,
  });

  const imgData = canvas.toDataURL('image/jpeg', quality);
  const pdf = new jsPDF(orientation, unit, format);
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, (pdfHeight - 16) / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const renderedHeight = imgHeight * ratio;

  pdf.setFontSize(10);
  pdf.setTextColor(100);
  pdf.text(`VERTICHE - Reporte generado: ${new Date().toLocaleString('es-MX')}`, 10, 7);

  if (renderedHeight <= pdfHeight - 16) {
    pdf.addImage(imgData, 'JPEG', imgX, 10, imgWidth * ratio, renderedHeight);
  } else {
    let heightLeft = renderedHeight;
    let position = 10;

    while (heightLeft > 0) {
      pdf.addImage(imgData, 'JPEG', imgX, position, imgWidth * ratio, renderedHeight);
      heightLeft -= pdfHeight - 20;
      position -= pdfHeight - 20;
      if (heightLeft > 0) pdf.addPage();
    }
  }

  pdf.save(filename);
  return true;
}

export function generarNombrePDF(etapa) {
  const fecha = new Date().toISOString().split('T')[0];
  const hora = new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  return `reporte-${etapa}-${fecha}_${hora}.pdf`;
}

