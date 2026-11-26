import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const knowledgePath = path.join(__dirname, '..', 'knowledge', 'department.json');
const knowledge = JSON.parse(fs.readFileSync(knowledgePath, 'utf8'));

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'CISHub AI' }));

app.post('/chat', async (req, res) => {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'Message is required.' });
    if (message.length > 4000) return res.status(413).json({ error: 'Message is too long.' });
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: 'AI service is not configured yet. Set GROQ_API_KEY.' });
    }

    const instructions = `You are CISHub AI, the official informational assistant for the Department of Computer Information Systems at the University of Basrah.\n` +
      `SCOPE: Answer only questions related to this department, its study information, facilities, staff, and official student guidance when supported by the supplied knowledge. Politely explain that unrelated questions are outside your scope.\n` +
      `GROUNDING: Use only the knowledge below. Do not guess, invent policies, dates, staff details, fees, or requirements. If the answer is not present, say that verified information is not currently available and direct the student to the department/college official channels. Distinguish academic-year-specific information from current information.\n` +
      `LANGUAGE: Reply in the same language as the user's message. Understand Iraqi Arabic, Modern Standard Arabic, and English. Be clear and concise.\n\n` +
      `APPROVED STARTER KNOWLEDGE:\n${JSON.stringify(knowledge, null, 2)}`;

    // Try primary model, fallback to alternatives if not available
    const modelsToTry = [
      process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
      'llama-3.1-70b-versatile',
      'mixtral-8x7b-32768',
      'gemma2-9b-it'
    ];

    let lastError;
    for (const model of modelsToTry) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: instructions },
              { role: 'user', content: message }
            ],
            max_tokens: 700,
            temperature: 0.3
          })
        });
        const data = await response.json();
        if (!response.ok) {
          lastError = data;
          console.warn(`Groq model ${model} failed:`, data.error?.message);
          continue; // Try next model
        }
        const answer = data.choices?.[0]?.message?.content?.trim();
        if (answer) {
          console.log(`Groq success with model: ${model}`);
          return res.json({ answer });
        }
      } catch (error) {
        lastError = error;
        console.warn(`Groq model ${model} error:`, error.message);
      }
    }

    console.error('All Groq models failed:', lastError);
    return res.status(502).json({ error: 'The AI provider could not complete the request.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Unexpected server error.' });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`CISHub AI backend listening on port ${port}`));
