import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Méthode non autorisée' });

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: 'Historique de messages manquant ou invalide' });
  }

  try {
    const assistant_id = 'asst_EEytzYNVHpqawyRgxxb7yhf0'; // <-- Ton assistant ID ici

    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: messages[messages.length - 1].content
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id
    });

    // Attente du résultat
    let status = 'queued';
    while (status !== 'completed' && status !== 'failed') {
      await new Promise(r => setTimeout(r, 1000));
      const updatedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = updatedRun.status;
    }

    if (status === 'failed') {
      return res.status(500).json({ error: 'Échec de génération de réponse' });
    }

    const messagesResponse = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = messagesResponse.data.find(msg => msg.role === 'assistant');
    const response = assistantMessage?.content?.[0]?.text?.value || 'Réponse introuvable.';

    res.status(200).json({ response });
  } catch (err) {
    console.error('Erreur OpenAI:', err);
    res.status(500).json({ error: 'Erreur interne' });
  }
}
