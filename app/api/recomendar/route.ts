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
    const apiUrl = `https://backend-api-production-5020.up.railway.app/recomendar?capital=${capital}&riesgo=${riesgo}&plazo=${plazo}`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ error: data.error || 'Error en la API externa' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (e: unknown) {
    if (e instanceof Error) {
      console.error('Error en API:', e.message);
    } else {
      console.error('Error desconocido en API:', e);
    }

    return NextResponse.json({ error: 'Error interno al consultar el modelo' }, { status: 500 });
  }
}
