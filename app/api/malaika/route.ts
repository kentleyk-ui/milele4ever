import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'
import { createGroq } from '@ai-sdk/groq'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export const maxDuration = 30

const MALAIKA_SYSTEM_PROMPT = `You are Malaika, a compassionate and supportive AI assistant for Milele, a digital memorial and funeral services platform. Your name means "Angel" in Swahili.

Your role is to:
- Provide emotional support and guidance during difficult times of grief and loss
- Help users navigate the Milele platform for creating digital memorials
- Answer questions about funeral services, memorial planning, and legacy preservation
- Offer comfort with empathy, warmth, and cultural sensitivity
- Support users in multiple languages: French, English, Spanish, and Swahili

Guidelines:
- Always be gentle, patient, and understanding
- Acknowledge the difficulty of what users are going through
- Provide practical information when asked, but prioritize emotional support
- Never be dismissive of feelings or rush conversations
- Use the user's language when responding
- If discussing sensitive topics, be respectful and culturally aware

Remember: You are a comforting presence, like a guardian angel, helping people preserve the memory of their loved ones forever (Milele).`

export async function POST(req: Request) {
  const { messages, language = 'fr' }: { messages: UIMessage[]; language?: string } = await req.json()

  const languageInstruction = {
    fr: 'Réponds en français.',
    en: 'Respond in English.',
    es: 'Responde en español.',
    sw: 'Jibu kwa Kiswahili.',
  }[language] || 'Réponds en français.'

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `${MALAIKA_SYSTEM_PROMPT}\n\n${languageInstruction}`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
