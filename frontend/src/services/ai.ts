import type { Project, Asset, TokenUsage } from '@/stores/projects'
import type { AISettings } from '@/stores/settings'
import { calculateTokenCost } from '@/config/ai-models'

export interface TestResult {
  success: boolean
  message: string
  responseTime?: number
}

export interface GenerationResult {
  prompt: string
  tokenUsage: TokenUsage
}

export async function testAIConnection(settings: AISettings): Promise<TestResult> {
  const startTime = Date.now()

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')

    if (!settings.geminiApiKey.trim()) {
      return {
        success: false,
        message: 'API key is required'
      }
    }

    const genAI = new GoogleGenerativeAI(settings.geminiApiKey)
    const model = genAI.getGenerativeModel({ model: settings.model })

    const result = await model.generateContent('Say "Hello" in one word.')
    const response = result.response
    const text = response.text()

    const responseTime = Date.now() - startTime

    if (text && text.trim().length > 0) {
      return {
        success: true,
        message: 'Connection successful! AI is responding correctly.',
        responseTime
      }
    } else {
      return {
        success: false,
        message: 'AI responded but with empty content'
      }
    }
  } catch (error: any) {
    const responseTime = Date.now() - startTime
    let message = 'Connection failed'

    if (error.message?.includes('API_KEY_INVALID')) {
      message = 'Invalid API key. Please check your Gemini API key.'
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      message = 'Permission denied. Please verify your API key has the correct permissions.'
    } else if (error.message?.includes('QUOTA_EXCEEDED')) {
      message = 'API quota exceeded. Please check your usage limits.'
    } else if (error.message) {
      message = `Error: ${error.message}`
    }

    return {
      success: false,
      message,
      responseTime
    }
  }
}

export async function generateAssetPrompt(
  project: Project,
  asset: Asset,
  settings: AISettings
): Promise<GenerationResult> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')

  const genAI = new GoogleGenerativeAI(settings.geminiApiKey)
  const model = genAI.getGenerativeModel({ model: settings.model })

  const prompt = createPromptForAsset(project, asset)

  try {
    const result = await model.generateContent(prompt)
    const response = result.response
    
    // Extract token usage from the response
    const usageMetadata = result.response.usageMetadata
    const inputTokens = usageMetadata?.promptTokenCount || 0
    const outputTokens = usageMetadata?.candidatesTokenCount || 0
    const totalTokens = usageMetadata?.totalTokenCount || inputTokens + outputTokens
    
    // Calculate estimated cost
    const estimatedCost = calculateTokenCost(inputTokens, outputTokens, settings.model)
    
    const tokenUsage: TokenUsage = {
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
      timestamp: new Date()
    }

    return {
      prompt: response.text(),
      tokenUsage
    }
  } catch (error) {
    console.error('AI generation error:', error)
    throw new Error('Failed to generate asset prompt')
  }
}

function createPromptForAsset(project: Project, asset: Asset): string {
  const baseContext = `
Project Context: ${project.description}
Category: ${project.category}
Asset Type: ${asset.type}
Asset Name: ${asset.name}
Usage Context: ${asset.context}

IMPORTANT BRAND IDENTITY GUIDELINES:
- DO NOT include any company logos, brand names, or text overlays
- DO NOT reference specific company names or branded elements
- Focus on conveying brand identity through visual style, mood, atmosphere, and storytelling
- Use the project description and context to understand the brand's personality and values
- Express brand identity through color palettes, composition, lighting, and emotional tone
`

  switch (asset.type) {
    case 'image':
      return `${baseContext}

Based on the project context above, generate a detailed image generation prompt suitable for AI image generators like DALL-E, Midjourney, or Stable Diffusion.

The prompt must:
1. Convey brand identity through visual storytelling, mood, and atmosphere (NOT logos or text)
2. Specify detailed composition, lighting, color palette, and artistic style
3. Include emotional tone and narrative elements that reflect the brand's personality
4. Be optimized for the specific usage context described
5. Focus on creating a distinctive visual identity through style rather than branded elements
6. Include specific details about photography style, artistic direction, or visual metaphors

REMEMBER: Never include logos, company names, or text overlays. Brand identity should come from the visual style, mood, and storytelling approach.

Generate only the image prompt:`

    case 'text':
      return `${baseContext}

Based on the project context above, generate compelling text content appropriate for the specified usage context.

The content must:
1. Reflect the brand's personality and values through tone, voice, and messaging style
2. Use storytelling and emotional connection rather than direct brand mentions
3. Be engaging and resonate with the target audience implied by the project context
4. Convey brand identity through writing style, word choice, and narrative approach
5. Be optimized for the specific usage context described
6. Focus on the brand's unique value proposition and emotional appeal

REMEMBER: Do not mention specific company names. Brand identity should come through the voice, tone, and messaging approach.

Generate the text content:`

    case 'video':
      return `${baseContext}

Based on the project context above, generate a detailed video concept and script outline suitable for the specified usage context.

The concept must include:
1. Visual storytelling approach that conveys brand identity through cinematography and mood
2. Detailed description of visual style, color grading, and artistic direction
3. Narrative structure that reflects the brand's personality and values
4. Specific shots, scenes, and visual metaphors that support brand identity
5. Emotional journey and tone that aligns with the brand's character
6. Technical specifications (duration, pacing, style) optimized for the usage context

REMEMBER: Brand identity should be expressed through visual storytelling, cinematography, and narrative approach - not through logos or brand names. And the duration of the videos have to be 8 seconds.

Generate the video concept and outline:`

    case 'audio':
      return `${baseContext}

Based on the project context above, generate a detailed audio concept suitable for the specified usage context.

The concept must include:
1. Audio style and mood that reflects the brand's personality and emotional tone
2. Detailed description of musical style, instrumentation, and sonic palette
3. Voice and tone guidelines that convey brand identity through audio storytelling
4. Specific audio elements (music, sound design, vocal style) that support brand character
5. Emotional journey and atmosphere that aligns with the brand's values
6. Technical specifications (duration, structure, format) optimized for the usage context

REMEMBER: Brand identity should be expressed through audio style, tone, and sonic storytelling - not through brand names or jingles.

Generate the audio concept:`

    default:
      return `${baseContext}

Generate appropriate content for this asset that conveys brand identity through style, mood, and storytelling approach rather than direct brand references. Focus on the emotional and visual/auditory elements that will create a distinctive brand experience.`
  }
}