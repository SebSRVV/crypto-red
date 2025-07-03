import { spawn } from 'child_process';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const script = url.searchParams.get('script');
  const start = url.searchParams.get('start');
  const end = url.searchParams.get('end');

  if (!script || !['extractor', 'modelo'].includes(script)) {
    return jsonResponse({ error: 'Script inválido' }, 400);
  }

  const args: string[] = [`${script}.py`];
  if (script === 'extractor' && start && end) {
    args.push(start, end);
  }

  try {
    const output = await runPythonScript(args);
    return jsonResponse({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return jsonResponse({ error: message }, 500);
  }
}

// Ejecuta un script Python con argumentos y devuelve la salida
function runPythonScript(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const process = spawn('python', args);
    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    process.on('close', (code) => {
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(errorOutput || `El script finalizó con código ${code}`));
      }
    });
  });
}

// Devuelve una respuesta JSON tipada
function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
