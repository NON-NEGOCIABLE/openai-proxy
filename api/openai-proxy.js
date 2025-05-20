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

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Historique de messages manquant ou invalide' });
  }

  try {
    const assistant_id = 'asst_EEytzYNVHpqawyRgxxb7yhf0';

    // 1. Créer un nouveau thread
    const thread = await openai.beta.threads.create();

    // 2. Ajouter le dernier message utilisateur
    await openai.beta.threads.messages.create(thread.id, {
      role: 'user',
      content: messages[messages.length - 1].text
    });

    // 3. Lancer l'exécution avec l'assistant
    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id
    });

    // 4. Attendre la fin du run
    let status = 'queued';
    while (status !== 'completed' && status !== 'failed') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const updatedRun = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      status = updatedRun.status;
    }

    if (status === 'failed') {
      return res.status(500).json({ error: 'Assistant a échoué à répondre' });
    }

    // 5. Récupérer la dernière réponse
    const responseMessages = await openai.beta.threads.messages.list(thread.id);
    const assistantMessage = responseMessages.data.find(m => m.role === 'assistant');
    const response = assistantMessage?.content?.[0]?.text?.value || 'Réponse introuvable.';

    res.status(200).json({ response });
  } catch (error) {
    console.error('Erreur OpenAI :', error);
    res.status(500).json({ error: 'Erreur serveur OpenAI' });
  }
}
