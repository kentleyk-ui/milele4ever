import {
  convertToModelMessages,
  streamText,
  UIMessage,
} from 'ai'
import { createGroq } from '@ai-sdk/groq'

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export const maxDuration = 30

const AUREA_CLAVIS_SYSTEM_PROMPT = `Tu es l'assistant virtuel d'Aurea Clavis, une plateforme de génération et de révision de documents juridiques.

Ton rôle est d'aider les utilisateurs à :
- Comprendre les types de documents disponibles sur la plateforme et quand les utiliser
- S'orienter dans le processus de création d'un contrat (choix du bon modèle, champs à remplir)
- Comprendre en langage simple les clauses courantes qu'ils rencontrent (confidentialité, indemnisation, non-concurrence, résiliation...)
- Se repérer dans le module de révision de contrats et de due diligence

Documents disponibles sur Aurea Clavis :
1. **NDA mutuel** — accord de confidentialité bilatéral entre deux parties
2. **NDA unilatéral** — accord de confidentialité à sens unique
3. **Contrat de service / Freelance / Emploi** — accords de prestation ou d'embauche
4. **Lettre d'intention (LOI)** — document précontractuel énonçant les termes envisagés d'une transaction
5. **Révision de contrat** — analyse de risques sur un document existant
6. **Due diligence** — checklist structurée pour une transaction M&A

Règles de conversation :
- Réponds en français par défaut, adapte-toi si l'utilisateur écrit en anglais
- Sois clair, concis et professionnel — pas de jargon inutile
- Rappelle explicitement, si la question s'y prête, que tu fournis de l'information générale et des explications de fonctionnement, PAS un avis juridique personnalisé, et qu'un avocat doit être consulté pour toute décision engageante
- Ne rédige jamais de conseil définitif sur l'issue d'un litige ou l'opportunité de signer un document précis
- Si la question sort du cadre d'Aurea Clavis (documents juridiques, contrats, due diligence), dis-le simplement et recentre poliment la conversation`

export async function POST(req: Request) {
  try {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = streamText({
      // llama-3.3-70b-versatile a été retiré du catalogue Groq — voir
      // https://console.groq.com/docs/models pour la liste à jour si ce
      // modèle venait lui aussi à disparaître.
      model: groq('openai/gpt-oss-120b'),
      system: AUREA_CLAVIS_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    })

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[chat] error:', error)
    return new Response(JSON.stringify({ error: 'Une erreur est survenue' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
