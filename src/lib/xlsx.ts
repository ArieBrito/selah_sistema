/**
 * Genera un .xlsx de una sola hoja sin librerías: un ZIP sin compresión con el
 * XML mínimo que Excel necesita. Las librerías de Excel más usadas arrastran
 * vulnerabilidades conocidas, y para una tabla sencilla no hacen falta.
 */

type Celda = string | number;

const CRC_TABLA = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(datos: Uint8Array) {
  let crc = 0xffffffff;
  for (const b of datos) crc = CRC_TABLA[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function zip(archivos: { nombre: string; contenido: string }[]): Uint8Array<ArrayBuffer> {
  const enc = new TextEncoder();
  const locales: Uint8Array[] = [];
  const centrales: Uint8Array[] = [];
  let offset = 0;

  for (const archivo of archivos) {
    const nombre = enc.encode(archivo.nombre);
    const datos = enc.encode(archivo.contenido);
    const crc = crc32(datos);

    const local = new Uint8Array(30 + nombre.length + datos.length);
    const vl = new DataView(local.buffer);
    vl.setUint32(0, 0x04034b50, true);
    vl.setUint16(4, 20, true);
    vl.setUint16(12, 0x21, true); // fecha: 1980-01-01
    vl.setUint32(14, crc, true);
    vl.setUint32(18, datos.length, true);
    vl.setUint32(22, datos.length, true);
    vl.setUint16(26, nombre.length, true);
    local.set(nombre, 30);
    local.set(datos, 30 + nombre.length);

    const central = new Uint8Array(46 + nombre.length);
    const vc = new DataView(central.buffer);
    vc.setUint32(0, 0x02014b50, true);
    vc.setUint16(4, 20, true);
    vc.setUint16(6, 20, true);
    vc.setUint16(14, 0x21, true);
    vc.setUint32(16, crc, true);
    vc.setUint32(20, datos.length, true);
    vc.setUint32(24, datos.length, true);
    vc.setUint16(28, nombre.length, true);
    vc.setUint32(42, offset, true);
    central.set(nombre, 46);

    locales.push(local);
    centrales.push(central);
    offset += local.length;
  }

  const tamCentral = centrales.reduce((s, c) => s + c.length, 0);
  const fin = new Uint8Array(22);
  const vf = new DataView(fin.buffer);
  vf.setUint32(0, 0x06054b50, true);
  vf.setUint16(8, archivos.length, true);
  vf.setUint16(10, archivos.length, true);
  vf.setUint32(12, tamCentral, true);
  vf.setUint32(16, offset, true);

  const partes = [...locales, ...centrales, fin];
  const salida = new Uint8Array(partes.reduce((s, p) => s + p.length, 0));
  let pos = 0;
  for (const p of partes) {
    salida.set(p, pos);
    pos += p.length;
  }
  return salida;
}

function escaparXml(texto: string) {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function columna(i: number) {
  let nombre = "";
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) nombre = String.fromCharCode(65 + ((n - 1) % 26)) + nombre;
  return nombre;
}

/** La primera fila va en negritas (encabezado); los números se formatean como #,##0.00. */
export function crearXlsx(filas: Celda[][], nombreHoja: string): Blob {
  const xmlFilas = filas
    .map((fila, r) => {
      const celdas = fila
        .map((valor, c) => {
          const ref = `${columna(c)}${r + 1}`;
          if (typeof valor === "number") return `<c r="${ref}" s="2"><v>${valor}</v></c>`;
          return `<c r="${ref}" t="inlineStr"${r === 0 ? ' s="1"' : ""}><is><t>${escaparXml(valor)}</t></is></c>`;
        })
        .join("");
      return `<row r="${r + 1}">${celdas}</row>`;
    })
    .join("");

  const xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  const contenido = zip([
    {
      nombre: "[Content_Types].xml",
      contenido: `${xml}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    },
    {
      nombre: "_rels/.rels",
      contenido: `${xml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      nombre: "xl/workbook.xml",
      contenido: `${xml}<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escaparXml(nombreHoja)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    },
    {
      nombre: "xl/_rels/workbook.xml.rels",
      contenido: `${xml}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      nombre: "xl/styles.xml",
      contenido: `${xml}<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    },
    {
      nombre: "xl/worksheets/sheet1.xml",
      contenido: `${xml}<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="44" customWidth="1"/></cols><sheetData>${xmlFilas}</sheetData></worksheet>`,
    },
  ]);

  return new Blob([contenido], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
