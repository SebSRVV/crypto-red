import { spawn } from 'child_process';
import path from 'path';

export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const script = url.searchParams.get('script');
  const page = url.searchParams.get('page');

  if (!script || !['extractor', 'modelo_general'].includes(script)) {
    return jsonResponse({ error: 'Script inválido' }, 400);
  }

  const scriptPath = path.resolve('scripts', `${script}.py`);
  const args: string[] = [scriptPath];

  if (script === 'extractor' && page) {
    args.push(page);
  }

  try {
    const output = await runPythonScript(args);
    return jsonResponse({ output });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return jsonResponse({ error: message }, 500);
  }
}

// Ejecuta un script Python con los argumentos dados
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


function jsonResponse(data: object, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}
