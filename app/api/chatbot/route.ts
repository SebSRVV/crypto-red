import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  let { messages } = await req.json();

  // Agregar mensaje de sistema para definir la personalidad de Sun
  const systemMessage = {
    role: "system",
    content: "Eres Sun, un asistente experto en criptomonedas. Responde de forma clara y precisa a las preguntas de los usuarios."
  };
  // Asegurarse de que el mensaje de sistema esté al inicio
  if (!messages || !Array.isArray(messages)) messages = [];
  messages = [systemMessage, ...messages];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct:free", // Modelo gratuito seleccionado por el usuario
      messages,
      max_tokens: 80,
      temperature: 0.2
    })
  });
  const data = await response.json();
  console.log('Respuesta de OpenRouter:', data); // Log para depuración
  const reply = data.choices?.[0]?.message?.content || "Lo siento, no puedo responder eso.";
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
  return NextResponse.json({ models: json.data?.map((m: any) => m.id) || [] });
} 