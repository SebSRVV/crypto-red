"use client";
import React, { useState, useRef, useEffect } from "react";
import { WiDaySunny } from "react-icons/wi";
import styles from "./Chatbot.module.css";

const SYSTEM_PROMPT = `
Eres SUN, el asistente oficial de la app CryptoReed. Solo puedes responder preguntas relacionadas con el funcionamiento de la app, predicciones de criptomonedas, niveles de riesgo, inversión y uso de la plataforma. No respondas preguntas fuera de este contexto. Sé claro, breve y útil.
`;

const FAQS = [
  "¿Dónde veo mis predicciones?",
  "¿Cómo cambio mi nivel de riesgo?",
  "¿Qué crypto recomiendan hoy?"
];

async function fetchChatbotResponse(messages: {role: string, content: string}[]) {
  const res = await fetch("/api/chatbot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  const data = await res.json();
  return data.reply;
}

export default function Chatbot() {
  const [isMounted, setIsMounted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [messages, setMessages] = useState([
    { role: "system", content: SYSTEM_PROMPT }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    const stored = window.localStorage.getItem("sunai_visible");
    setVisible(stored === null ? true : stored === "true");
  }, []);

  useEffect(() => {
    if (isMounted) {
      window.localStorage.setItem("sunai_visible", visible ? "true" : "false");
    }
  }, [visible, isMounted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (question?: string) => {
    const userInput = question || input;
    if (!userInput.trim()) return;
    const newMessages = [...messages, { role: "user", content: userInput }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const reply = await fetchChatbotResponse(newMessages);
    setMessages([...newMessages, { role: "assistant", content: reply }]);
    setLoading(false);
  };

  if (!isMounted) return null;

  return (
    <>
      {!visible && (
        <button
          className={styles.fab}
          onClick={() => setVisible(true)}
          aria-label="Mostrar Sun AI"
        >
          <WiDaySunny size={32} className={styles.sunIcon} />
        </button>
      )}
      {visible && (
        <div className={styles.chatbotContainer}>
          <div className={styles.header}>
            <WiDaySunny size={34} className={styles.sunIcon} />
            <span className={styles.title}>Sun AI</span>
            <button
              onClick={() => setVisible(false)}
              className={styles.closeBtn}
              aria-label="Ocultar Sun AI"
            >
              ×
            </button>
          </div>
          <div className={styles.faqs}>
            {FAQS.map((faq, i) => (
              <button
                key={i}
                className={styles.faqButton}
                onClick={() => handleSend(faq)}
                disabled={loading}
              >
                {faq}
              </button>
            ))}
          </div>
          <div className={styles.messages}>
            {messages.filter(m => m.role !== "system").map((m, i) => (
              <div
                key={i}
                className={
                  styles.messageRow +
                  (m.role === "user" ? " " + styles.user : "")
                }
              >
                {m.role === "assistant" && (
                  <WiDaySunny size={22} className={styles.assistantIcon} />
                )}
                <span
                  className={styles.messageContent}
                >
                  {m.content}
                </span>
              </div>
            ))}
            {loading && (
              <div className={styles.loading}>
                SUN está escribiendo...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className={styles.inputRow}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSend()}
              placeholder="Escribe tu pregunta..."
              className={styles.input}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className={styles.sendButton}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
} 