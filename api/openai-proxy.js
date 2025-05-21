import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "Historique de messages manquant" });
  }

  try {
    // Création d'un thread de conversation
    const thread = await openai.beta.threads.create();

    // Ajout de chaque message au thread
    for (const m of messages) {
      await openai.beta.threads.messages.create(thread.id, {
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      });
    }

    // Lancement du run avec l'assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_EEytzYYNHgpawyRgvxb7yhf0",
    });

    // Attente de la complétion du run
    let completedRun;
    const maxWait = 30; // secondes max
    for (let i = 0; i < maxWait; i++) {
      completedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      if (completedRun.status === "completed") break;
      await new Promise(r => setTimeout(r, 1000));
    }

    if (completedRun.status !== "completed") {
      return res.status(500).json({ error: "Temps d’attente dépassé" });
    }

    // Récupération de la réponse de l'assistant
    const threadMessages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = threadMessages.data.find(m => m.role === "assistant");

    if (!lastMessage) {
      return res.status(500).json({ error: "Réponse de l’assistant introuvable" });
    }

    return res.status(200).json({ response: lastMessage.content[0].text.value });
  } catch (err) {
    console.error("Erreur:", err);
    return res.status(500).json({ error: "Erreur serveur", details: err.message });
  }
}
