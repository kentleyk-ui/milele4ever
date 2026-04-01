import {
  consumeStream,
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'
import { createGroq } from '@ai-sdk/groq'
import { createClient } from '@/lib/supabase/server'

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
  const { messages, language = 'fr', conversationId, memorialId }: { 
    messages: UIMessage[]
    language?: string
    conversationId?: string
    memorialId?: string
  } = await req.json()

  const languageInstruction = {
    fr: 'Réponds en français.',
    en: 'Respond in English.',
    es: 'Responde en español.',
    sw: 'Jibu kwa Kiswahili.',
  }[language] || 'Réponds en français.'

  // Get user if authenticated (for saving history)
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Build system prompt with memorial context if provided
  let systemPrompt = MALAIKA_SYSTEM_PROMPT

  if (memorialId && user) {
    // Fetch memorial data for context
    const { data: memorial } = await supabase
      .from('memorials')
      .select('full_name, biography, date_of_birth, date_of_death')
      .eq('id', memorialId)
      .single()

    if (memorial) {
      systemPrompt += `\n\nContext: The user is currently viewing the memorial of ${memorial.full_name}.
Birth: ${memorial.date_of_birth || 'Unknown'}
Death: ${memorial.date_of_death || 'Unknown'}
Biography: ${memorial.biography || 'Not provided'}

Use this context to provide more personalized and relevant responses about their loved one.`
    }
  }

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'),
    system: `${systemPrompt}\n\n${languageInstruction}`,
    messages: await convertToModelMessages(messages),
    abortSignal: req.signal,
    onFinish: async ({ text }) => {
      // Save conversation to database if user is authenticated
      if (user && messages.length > 0) {
        try {
          let activeConversationId = conversationId

          // Create new conversation if needed
          if (!activeConversationId) {
            const firstUserMessage = messages.find(m => m.role === 'user')
            const title = firstUserMessage?.content?.toString().slice(0, 50) || 'Nouvelle conversation'
            
            const { data: newConvo } = await supabase
              .from('malaika_conversations')
              .insert({
                user_id: user.id,
                title,
                memorial_id: memorialId || null
              })
              .select('id')
              .single()

            activeConversationId = newConvo?.id
          }

          // Save the latest user message and assistant response
          if (activeConversationId) {
            const lastUserMessage = messages[messages.length - 1]
            if (lastUserMessage?.role === 'user') {
              await supabase.from('malaika_messages').insert([
                {
                  conversation_id: activeConversationId,
                  role: 'user',
                  content: lastUserMessage.content?.toString() || ''
                },
                {
                  conversation_id: activeConversationId,
                  role: 'assistant',
                  content: text
                }
              ])
            }
          }
        } catch (error) {
          console.error('[v0] Error saving Malaika conversation:', error)
        }
      }
    }
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    consumeSseStream: consumeStream,
  })
}
