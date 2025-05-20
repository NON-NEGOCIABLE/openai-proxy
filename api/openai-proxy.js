import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt manquant' });
  }

  try {
    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: prompt,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_EEytzYYNHgpawyRgvxb7yhf0", // Ton assistant
    });

    // Attente du run jusqu'à sa complétion
    let status = run.status;
    let attempts = 0;
    while (status !== 'completed' && attempts < 20) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = updatedRun.status;
      attempts++;
    }

    if (status !== 'completed') {
      return res.status(500).json({ error: "L'assistant met trop de temps à répondre." });
    }

    const messages = await openai.beta.threads.messages.list(thread.id);
    const lastMessage = messages.data.find(msg => msg.role === 'assistant');

    return res.status(200).json({ response: lastMessage?.content[0]?.text?.value || "(Pas de réponse)" });
  } catch (err) {
    console.error("Erreur:", err);
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
