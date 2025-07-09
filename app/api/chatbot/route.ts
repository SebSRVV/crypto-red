import { NextRequest, NextResponse } from "next/server";
import { readFileSync } from "fs";
import path from "path";

export async function POST(req: NextRequest) {
  let { messages } = await req.json();

  // Agregar mensaje de sistema para definir la personalidad de Sun
  const systemMessage = {
    role: "system",
    content: "Eres Sun, un asistente experto en criptomonedas. Responde de forma clara y precisa a las preguntas de los usuarios."
  };
  if (!messages || !Array.isArray(messages)) messages = [];
  messages = [systemMessage, ...messages];

  // Detectar si la última pregunta del usuario es sobre recomendaciones
  const userMsg = messages.filter((m: { role: string; content: string }) => m.role === "user").pop()?.content?.toLowerCase() || "";
  const preguntaRecomendacion = [
    "¿qué crypto recomiendan hoy?",
    "¿qué criptomonedas recomiendan?",
    "recomendación de criptomonedas",
    "recomiéndame una cripto",
    "recomiendame una cripto",
    "recomiéndame una criptomoneda",
    "recomiendame una criptomoneda",
    "recomendaciones de criptomonedas",
    "recomendaciones crypto"
  ];
  if (preguntaRecomendacion.some(q => userMsg.includes(q.replace(/[¿?]/g, "")))) {
    try {
      const recPath = path.join(process.cwd(), "public/data/recomendaciones.json");
      const raw = readFileSync(recPath, "utf-8");
      const recomendaciones = JSON.parse(raw);
      if (Array.isArray(recomendaciones) && recomendaciones.length > 0) {
        const lista = recomendaciones.map((r: { nombre: string, symbol: string }) => `${r.nombre} (${r.symbol})`).join(", ");
        const reply = `Las criptomonedas recomendadas actualmente por CryptoReed son: ${lista}.`;
        return NextResponse.json({ reply });
      } else {
        return NextResponse.json({ reply: "Actualmente no hay recomendaciones disponibles." });
      }
    } catch {
      return NextResponse.json({ reply: "No se pudo obtener la lista de recomendaciones en este momento." });
    }
  }

  // Si no es una pregunta de recomendación, usar el modelo de IA
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free",
      messages,
      max_tokens: 200,
      temperature: 0.2
    })
  });
  const data = await response.json();
  console.log('Respuesta de OpenRouter:', data); // Log para depuración
  let reply = data.choices?.[0]?.message?.content || "Lo siento, no puedo responder eso.";
  if (reply && !reply.trim().endsWith(".")) {
    const lastDot = reply.lastIndexOf(".");
    if (lastDot !== -1) {
      reply = reply.slice(0, lastDot + 1);
    }
  }
  return NextResponse.json({ reply });
}

export async function GET() {
  const resp = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`
    }
  });
  const json = await resp.json();
  // Devuelve solo los IDs de los modelos disponibles
  return NextResponse.json({ models: json.data?.map((m: { id: string }) => m.id) || [] });
} 