import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'child_process';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const script = url.searchParams.get('script');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (!script || !['extractor', 'modelo'].includes(script)) {
    return NextResponse.json({ error: 'Script inválido' }, { status: 400 });
  }

  const args = [script + '.py'];

  if (script === 'extractor' && start && end) {
    args.push(start, end);
  }

  return new Promise((resolve) => {
    const child = spawn('python', args);
    let output = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      output += data.toString(); // capturar errores también
    });

    child.on('close', () => {
      resolve(NextResponse.json({ output }));
    });
  });
}
