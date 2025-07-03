import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import path from 'path';

export async function GET() {
  const logPath = path.join(process.cwd(), 'public/data/log.txt');
  try {
    const content = readFileSync(logPath, 'utf-8');
    return NextResponse.json({ log: content });
  } catch {
    return NextResponse.json({ log: '⚠️ No hay log disponible.' }, { status: 404 });
  }
}
