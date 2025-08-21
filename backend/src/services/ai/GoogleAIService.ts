/**
 * Google AI Service for AI generation using Gemini models
 */

import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

export interface GoogleAIConfig {
  apiKey: string;
  model: string;
}

export interface GoogleAITextGenerationOptions {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

export interface GoogleAIResponse {
  text: string;
  finishReason?: string;
  safetyRatings?: Array<{
    category: string;
    probability: string;
  }>;
}

export class GoogleAIService {
  private genAI: GoogleGenerativeAI | null = null;

  /**
   * Initialize Google AI client with API key
   */
  private initializeClient(apiKey: string): GoogleGenerativeAI {
    if (!this.genAI || this.genAI.apiKey !== apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
    return this.genAI;
  }

  /**
   * Generate text using Gemini models
   */
  async generateText(
    prompt: string, 
    config: GoogleAIConfig, 
    options: GoogleAITextGenerationOptions = {}
  ): Promise<GoogleAIResponse> {
    try {
      console.log(`[Google AI] Generating text with model ${config.model}: ${prompt.substring(0, 100)}...`);
      
      const genAI = this.initializeClient(config.apiKey);
      const model: GenerativeModel = genAI.getGenerativeModel({ 
        model: config.model,
        generationConfig: {
          temperature: options.temperature ?? 0.7,
          maxOutputTokens: options.maxOutputTokens ?? 1000,
          topP: options.topP ?? 0.8,
          topK: options.topK ?? 40,
        }
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      return {
        text,
        finishReason: response.candidates?.[0]?.finishReason,
        safetyRatings: response.candidates?.[0]?.safetyRatings?.map(rating => ({
          category: rating.category,
          probability: rating.probability
        }))
      };
    } catch (error) {
      console.error('[Google AI] Text generation failed:', error);
      throw new Error(`Google AI text generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * Enhance a prompt using Gemini for better AI generation results
   */
  async enhancePrompt(
    basePrompt: string,
    config: GoogleAIConfig,
    context?: {
      assetType?: 'image' | 'video' | 'prompt';
      artStyle?: string;
      styleKeywords?: string[];
    }
  ): Promise<GoogleAIResponse> {
    try {
      const enhancementPrompt = this.buildPromptEnhancementRequest(basePrompt, context);
      
      return await this.generateText(enhancementPrompt, config, {
        temperature: 0.8,
        maxOutputTokens: 800
      });
    } catch (error) {
      console.error('[Google AI] Prompt enhancement failed:', error);
      throw error;
    }
  }

  /**
   * Generate prompt suggestions based on input and context
   */
  async generatePromptSuggestions(
    basePrompt: string,
    config: GoogleAIConfig,
    context?: {
      assetType?: 'image' | 'video' | 'prompt';
      artStyle?: string;
      count?: number;
    }
  ): Promise<string[]> {
    try {
      const suggestionPrompt = this.buildPromptSuggestionRequest(basePrompt, context);
      
      const response = await this.generateText(suggestionPrompt, config, {
        temperature: 0.9,
        maxOutputTokens: 1200
      });

      // Parse the response to extract individual suggestions
      return this.parsePromptSuggestions(response.text);
    } catch (error) {
      console.error('[Google AI] Prompt suggestions failed:', error);
      throw error;
    }
  }

  /**
   * Score prompt quality and provide improvement suggestions
   */
  async scorePrompt(
    prompt: string,
    config: GoogleAIConfig,
    context?: {
      assetType?: 'image' | 'video' | 'prompt';
      artStyle?: string;
    }
  ): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    try {
      const scoringPrompt = this.buildPromptScoringRequest(prompt, context);
      
      const response = await this.generateText(scoringPrompt, config, {
        temperature: 0.3,
        maxOutputTokens: 600
      });

      return this.parsePromptScore(response.text);
    } catch (error) {
      console.error('[Google AI] Prompt scoring failed:', error);
      throw error;
    }
  }

  /**
   * Validate API key by making a simple test request
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    try {
      console.log(`[Google AI] Validating API key: ${apiKey.substring(0, 10)}...`);
      
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-002' });
      
      // Make a simple test request
      const result = await model.generateContent('Hello');
      const response = await result.response;
      
      return !!response.text();
    } catch (error) {
      console.error('[Google AI] API key validation failed:', error);
      return false;
    }
  }

  /**
   * Build prompt enhancement request
   */
  private buildPromptEnhancementRequest(
    basePrompt: string,
    context?: {
      assetType?: 'image' | 'video' | 'prompt';
      artStyle?: string;
      styleKeywords?: string[];
    }
  ): string {
    let enhancementPrompt = `You are an expert prompt engineer specializing in AI content generation. Your task is to enhance and improve the following prompt to make it more effective for AI generation.

Original prompt: "${basePrompt}"`;

    if (context?.assetType) {
      enhancementPrompt += `\nAsset type: ${context.assetType}`;
    }

    if (context?.artStyle) {
      enhancementPrompt += `\nArt style: ${context.artStyle}`;
    }

    if (context?.styleKeywords && context.styleKeywords.length > 0) {
      enhancementPrompt += `\nStyle keywords: ${context.styleKeywords.join(', ')}`;
    }

    enhancementPrompt += `

Please enhance this prompt by:
1. Adding specific details that improve clarity and visual quality
2. Incorporating technical terms that AI models respond well to
3. Ensuring consistency with the specified art style
4. Adding composition, lighting, and quality descriptors
5. Maintaining the original creative intent

Return only the enhanced prompt without explanations or additional text.`;

    return enhancementPrompt;
  }

  /**
   * Build prompt suggestion request
   */
  private buildPromptSuggestionRequest(
    basePrompt: string,
    context?: {
      assetType?: 'image' | 'video' | 'prompt';
      artStyle?: string;
      count?: number;
    }
  ): string {
    const count = context?.count || 3;
    
    let suggestionPrompt = `You are a creative prompt engineer. Generate ${count} alternative prompts based on the following input:

Original prompt: "${basePrompt}"`;

    if (context?.assetType) {
      suggestionPrompt += `\nAsset type: ${context.assetType}`;
    }

    if (context?.artStyle) {
      suggestionPrompt += `\nArt style: ${context.artStyle}`;
    }

    suggestionPrompt += `

Create ${count} creative variations that:
1. Maintain the core concept but explore different angles
2. Vary in complexity and detail level
3. Are optimized for AI generation
4. Include relevant technical and artistic terms

Format your response as a numbered list:
1. [First suggestion]
2. [Second suggestion]
3. [Third suggestion]`;

    return suggestionPrompt;
  }

  /**
   * Build prompt scoring request
   */
  private buildPromptScoringRequest(
    prompt: string,
    context?: {
      assetType?: 'image' | 'video' | 'prompt';
      artStyle?: string;
    }
  ): string {
    let scoringPrompt = `You are an expert prompt evaluator for AI content generation. Analyze the following prompt and provide a quality score and feedback.

Prompt to evaluate: "${prompt}"`;

    if (context?.assetType) {
      scoringPrompt += `\nAsset type: ${context.assetType}`;
    }

    if (context?.artStyle) {
      scoringPrompt += `\nExpected art style: ${context.artStyle}`;
    }

    scoringPrompt += `

Evaluate the prompt based on:
1. Clarity and specificity (25 points)
2. Technical quality and AI-friendly terms (25 points)
3. Creative potential and visual appeal (25 points)
4. Consistency with art style requirements (25 points)

Provide your response in this exact format:
SCORE: [number from 0-100]
FEEDBACK: [detailed feedback paragraph]
SUGGESTIONS:
- [improvement suggestion 1]
- [improvement suggestion 2]
- [improvement suggestion 3]`;

    return scoringPrompt;
  }

  /**
   * Parse prompt suggestions from AI response
   */
  private parsePromptSuggestions(response: string): string[] {
    const suggestions: string[] = [];
    const lines = response.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^\d+\.\s*(.+)$/);
      if (match) {
        suggestions.push(match[1].trim());
      }
    }
    
    // Fallback: if no numbered list found, split by lines and filter
    if (suggestions.length === 0) {
      return lines
        .filter(line => line.trim().length > 10)
        .slice(0, 3)
        .map(line => line.trim());
    }
    
    return suggestions;
  }

  /**
   * Parse prompt score from AI response
   */
  private parsePromptScore(response: string): {
    score: number;
    feedback: string;
    suggestions: string[];
  } {
    const scoreMatch = response.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = response.match(/FEEDBACK:\s*(.+?)(?=SUGGESTIONS:|$)/is);
    const suggestionsMatch = response.match(/SUGGESTIONS:\s*((?:-.+\n?)+)/is);
    
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 50;
    const feedback = feedbackMatch ? feedbackMatch[1].trim() : 'No feedback available';
    
    let suggestions: string[] = [];
    if (suggestionsMatch) {
      suggestions = suggestionsMatch[1]
        .split('\n')
        .map(line => line.replace(/^-\s*/, '').trim())
        .filter(line => line.length > 0);
    }
    
    return { score, feedback, suggestions };
  }
}

// Export singleton instance
export const googleAIService = new GoogleAIService();