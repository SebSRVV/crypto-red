import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const capital = searchParams.get('capital');
  const riesgo = searchParams.get('riesgo');
  const plazo = searchParams.get('plazo');
  const top_n = searchParams.get('top_n') || '5';

  if (!capital || !riesgo || !plazo) {
    return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
  }

  try {
    // Ejecutar el script Python localmente
    const pyArgs = [
      'scripts/modelo_portafolio.py',
      capital,
      riesgo,
      plazo,
      top_n
    ];
    
    const pythonProcess = spawn('python', pyArgs);

    let output = '';
    let errorOutput = '';

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
    });
    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    const exitCode: number = await new Promise((resolve) => {
      pythonProcess.on('close', resolve);
    });

    if (exitCode !== 0) {
      return NextResponse.json({ error: errorOutput || 'Error ejecutando el modelo' }, { status: 500 });
    }

    // Buscar el último bloque JSON en la salida
    const jsonMatch = output.match(/(\[\s*\{[\s\S]*\}\s*\])/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'No se pudo obtener la respuesta del modelo' }, { status: 500 });
    }
    const recomendaciones = JSON.parse(jsonMatch[1]);
    return NextResponse.json({ recomendaciones });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error interno al consultar el modelo local' }, { status: 500 });
  }
}
