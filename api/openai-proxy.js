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
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: "Tu es MAX, l’assistant d’un cabinet de conseil en négociation. Tu poses des questions si besoin, puis tu synthétises." },
        { role: 'user', content: prompt }
      ]
    });

    const response = completion.choices[0].message.content;
    res.status(200).json({ response });
  } catch (err) {
    console.error('Erreur OpenAI :', err);
    res.status(500).json({ error: 'Erreur serveur OpenAI' });
  }
}
