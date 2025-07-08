import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

const SCRIPT_PATH = path.resolve('scripts/modelo_portafolio.py');
const OUTPUT_JSON = path.resolve('public/data/recomendaciones.json');

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const capital = searchParams.get('capital');
  const riesgo = searchParams.get('riesgo');
  const plazo = searchParams.get('plazo');

  if (!capital || !riesgo || !plazo) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
  }

  const command = `python ${SCRIPT_PATH} ${capital} ${riesgo} ${plazo}`;

  try {
    // Ejecutar el script de recomendación
    await new Promise<void>((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          console.error('Error ejecutando el script:', stderr);
          return reject(new Error('Error ejecutando modelo de recomendación.'));
        }
        console.log(stdout);
        resolve();
      });
    });

    // Leer el archivo de salida
    if (!fs.existsSync(OUTPUT_JSON)) {
      return NextResponse.json({ error: 'No se generó el archivo de salida.' }, { status: 500 });
    }

    const raw = fs.readFileSync(OUTPUT_JSON, 'utf-8');
    const recomendaciones = JSON.parse(raw);

    return NextResponse.json({ recomendaciones });
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('Error en API:', e.message);
    } else {
      console.error('Error desconocido en API:', e);
    }

    return NextResponse.json({ error: 'Error interno en la API.' }, { status: 500 });
  }
}
