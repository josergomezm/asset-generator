/**
 * Prompt Management Service for handling prompt granularity, templates, and history
 */

import { Asset, Project } from '@asset-tool/types';
import { fileManager } from './FileManager';
import { projectService } from './ProjectService';
import { googleAIService } from './ai/GoogleAIService';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

export interface PromptComponent {
  id: string;
  type: 'subject' | 'style' | 'composition' | 'lighting' | 'camera' | 'mood' | 'quality' | 'technical';
  label: string;
  value: string;
  description?: string;
  weight?: number; // 1-10, importance of this component
}

export interface PromptBreakdown {
  id: string;
  originalPrompt: string;
  components: PromptComponent[];
  reconstructedPrompt: string;
  createdAt: string;
  projectId?: string;
  assetType?: Asset['type'];
}

export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  assetType: Asset['type'];
  category: string; // 'landscape', 'portrait', 'abstract', 'architectural', etc.
  components: Omit<PromptComponent, 'id' | 'value'>[];
  examplePrompt: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PromptHistory {
  id: string;
  projectId: string;
  assetId?: string;
  originalPrompt: string;
  enhancedPrompt?: string;
  version: number;
  parentId?: string; // For versioning/iterations
  metadata: {
    aiProvider?: string;
    aiModel?: string;
    enhancementType?: 'manual' | 'ai' | 'template';
    score?: number;
    feedback?: string;
  };
  createdAt: string;
}

export interface PromptSuggestion {
  id: string;
  type: 'improvement' | 'alternative' | 'component' | 'style';
  title: string;
  description: string;
  suggestedChange: string;
  confidence: number; // 0-1
  category: string;
  reasoning?: string;
}

export class PromptManagementService {
  private promptHistoryPath = 'prompts/history.json';
  private promptTemplatesPath = 'prompts/templates.json';
  private promptBreakdownsPath = 'prompts/breakdowns.json';

  constructor() {
    this.initializePromptStorage();
  }

  /**
   * Initialize prompt storage directories and files
   */
  private async initializePromptStorage(): Promise<void> {
    try {
      await fileManager.ensureDirectoryExists('prompts');
      
      // Initialize empty files if they don't exist
      const files = [
        { path: this.promptHistoryPath, data: [] },
        { path: this.promptTemplatesPath, data: this.getDefaultTemplates() },
        { path: this.promptBreakdownsPath, data: [] }
      ];

      for (const file of files) {
        if (!await fileManager.fileExists(file.path)) {
          await fileManager.writeJSON(file.path, file.data);
        }
      }
    } catch (error) {
      console.error('Failed to initialize prompt storage:', error);
    }
  }

  /**
   * Break down a prompt into its components using AI analysis
   */
  async breakdownPrompt(
    prompt: string,
    projectId?: string,
    assetType?: Asset['type'],
    aiConfig?: { provider: string; model: string; apiKey: string }
  ): Promise<PromptBreakdown> {
    try {
      let components: PromptComponent[] = [];

      if (aiConfig?.provider === 'google') {
        // Use Google AI to analyze and break down the prompt
        const analysisPrompt = this.buildPromptAnalysisRequest(prompt, assetType);
        
        const response = await googleAIService.generateText(
          analysisPrompt,
          { apiKey: aiConfig.apiKey, model: aiConfig.model },
          { temperature: 0.3, maxOutputTokens: 1000 }
        );

        components = this.parsePromptComponents(response.text);
      } else {
        // Fallback to rule-based component extraction
        components = this.extractComponentsRuleBased(prompt, assetType);
      }

      const breakdown: PromptBreakdown = {
        id: uuidv4(),
        originalPrompt: prompt,
        components,
        reconstructedPrompt: this.reconstructPromptFromComponents(components),
        createdAt: new Date().toISOString(),
        projectId,
        assetType
      };

      // Save breakdown
      await this.savePromptBreakdown(breakdown);

      return breakdown;
    } catch (error) {
      console.error('Failed to breakdown prompt:', error);
      throw error;
    }
  }

  /**
   * Generate prompt suggestions based on analysis
   */
  async generatePromptSuggestions(
    prompt: string,
    projectId?: string,
    assetType?: Asset['type'],
    aiConfig?: { provider: string; model: string; apiKey: string }
  ): Promise<PromptSuggestion[]> {
    try {
      let suggestions: PromptSuggestion[] = [];

      if (aiConfig?.provider === 'google') {
        // Use Google AI to generate intelligent suggestions
        const project = projectId ? await projectService.getProjectById(projectId) : null;
        const suggestionPrompt = this.buildSuggestionAnalysisRequest(prompt, assetType, project);
        
        const response = await googleAIService.generateText(
          suggestionPrompt,
          { apiKey: aiConfig.apiKey, model: aiConfig.model },
          { temperature: 0.7, maxOutputTokens: 1200 }
        );

        suggestions = this.parseSuggestions(response.text);
      } else {
        // Fallback to rule-based suggestions
        suggestions = this.generateRuleBasedSuggestions(prompt, assetType);
      }

      return suggestions;
    } catch (error) {
      console.error('Failed to generate prompt suggestions:', error);
      throw error;
    }
  }

  /**
   * Get prompt templates by asset type and category
   */
  async getPromptTemplates(
    assetType?: Asset['type'],
    category?: string,
    tags?: string[]
  ): Promise<PromptTemplate[]> {
    try {
      const allTemplates = await fileManager.readJSON<PromptTemplate[]>(this.promptTemplatesPath);
      
      let filteredTemplates = allTemplates;

      if (assetType) {
        filteredTemplates = filteredTemplates.filter(t => t.assetType === assetType);
      }

      if (category) {
        filteredTemplates = filteredTemplates.filter(t => t.category === category);
      }

      if (tags && tags.length > 0) {
        filteredTemplates = filteredTemplates.filter(t => 
          tags.some(tag => t.tags.includes(tag))
        );
      }

      return filteredTemplates;
    } catch (error) {
      console.error('Failed to get prompt templates:', error);
      return [];
    }
  }

  /**
   * Create a new prompt template
   */
  async createPromptTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<PromptTemplate> {
    try {
      const newTemplate: PromptTemplate = {
        ...template,
        id: uuidv4(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const templates = await fileManager.readJSON<PromptTemplate[]>(this.promptTemplatesPath);
      templates.push(newTemplate);
      await fileManager.writeJSON(this.promptTemplatesPath, templates);

      return newTemplate;
    } catch (error) {
      console.error('Failed to create prompt template:', error);
      throw error;
    }
  }

  /**
   * Save prompt to history
   */
  async savePromptHistory(
    projectId: string,
    originalPrompt: string,
    enhancedPrompt?: string,
    assetId?: string,
    metadata?: Partial<PromptHistory['metadata']>
  ): Promise<PromptHistory> {
    try {
      const history = await fileManager.readJSON<PromptHistory[]>(this.promptHistoryPath);
      
      // Find the latest version for this project/asset
      const existingVersions = history.filter(h => 
        h.projectId === projectId && 
        (assetId ? h.assetId === assetId : !h.assetId)
      );
      const latestVersion = Math.max(0, ...existingVersions.map(h => h.version));

      const newHistory: PromptHistory = {
        id: uuidv4(),
        projectId,
        assetId,
        originalPrompt,
        enhancedPrompt,
        version: latestVersion + 1,
        metadata: metadata || {},
        createdAt: new Date().toISOString()
      };

      history.push(newHistory);
      await fileManager.writeJSON(this.promptHistoryPath, history);

      return newHistory;
    } catch (error) {
      console.error('Failed to save prompt history:', error);
      throw error;
    }
  }

  /**
   * Get prompt history for a project
   */
  async getPromptHistory(projectId: string, assetId?: string): Promise<PromptHistory[]> {
    try {
      const history = await fileManager.readJSON<PromptHistory[]>(this.promptHistoryPath);
      
      return history
        .filter(h => h.projectId === projectId && (assetId ? h.assetId === assetId : true))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      console.error('Failed to get prompt history:', error);
      return [];
    }
  }

  /**
   * Build prompt analysis request for AI
   */
  private buildPromptAnalysisRequest(prompt: string, assetType?: Asset['type']): string {
    return `Analyze the following prompt and break it down into specific components. Identify the subject, style, composition, lighting, camera settings, mood, quality descriptors, and technical aspects.

Prompt to analyze: "${prompt}"
Asset type: ${assetType || 'unknown'}

Please provide the analysis in this JSON format:
{
  "components": [
    {
      "type": "subject|style|composition|lighting|camera|mood|quality|technical",
      "label": "Brief label",
      "value": "Extracted text",
      "description": "What this component contributes",
      "weight": 1-10
    }
  ]
}

Focus on identifying:
- Subject: Main elements, objects, people, scenes
- Style: Art style, artistic movement, visual style
- Composition: Layout, framing, perspective
- Lighting: Light conditions, shadows, time of day
- Camera: Camera angle, lens, depth of field
- Mood: Emotional tone, atmosphere
- Quality: Resolution, detail level, rendering quality
- Technical: Specific technical parameters

Return only the JSON, no additional text.`;
  }

  /**
   * Build suggestion analysis request for AI
   */
  private buildSuggestionAnalysisRequest(prompt: string, assetType?: Asset['type'], project?: Project | null): string {
    let analysisPrompt = `Analyze this prompt and provide specific suggestions for improvement:

Prompt: "${prompt}"
Asset type: ${assetType || 'unknown'}`;

    if (project?.artStyle) {
      analysisPrompt += `
Project art style: ${project.artStyle.description}
Style keywords: ${project.artStyle.styleKeywords?.join(', ') || 'none'}`;
    }

    analysisPrompt += `

Provide suggestions in this JSON format:
{
  "suggestions": [
    {
      "type": "improvement|alternative|component|style",
      "title": "Brief title",
      "description": "Detailed description",
      "suggestedChange": "Specific text to add/change",
      "confidence": 0.0-1.0,
      "category": "subject|style|composition|lighting|technical|quality",
      "reasoning": "Why this suggestion helps"
    }
  ]
}

Focus on:
- Missing important details that would improve generation quality
- Style consistency with project requirements
- Technical improvements for better AI generation
- Composition and visual appeal enhancements
- Clarity and specificity improvements

Return only the JSON, no additional text.`;

    return analysisPrompt;
  }

  /**
   * Parse AI response into prompt components
   */
  private parsePromptComponents(aiResponse: string): PromptComponent[] {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.components.map((comp: any) => ({
        id: uuidv4(),
        type: comp.type,
        label: comp.label,
        value: comp.value,
        description: comp.description,
        weight: comp.weight || 5
      }));
    } catch (error) {
      console.warn('Failed to parse AI component response, using fallback');
      return [];
    }
  }

  /**
   * Parse AI response into suggestions
   */
  private parseSuggestions(aiResponse: string): PromptSuggestion[] {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.suggestions.map((sugg: any) => ({
        id: uuidv4(),
        type: sugg.type,
        title: sugg.title,
        description: sugg.description,
        suggestedChange: sugg.suggestedChange,
        confidence: sugg.confidence,
        category: sugg.category,
        reasoning: sugg.reasoning
      }));
    } catch (error) {
      console.warn('Failed to parse AI suggestions response, using fallback');
      return [];
    }
  }

  /**
   * Rule-based component extraction (fallback)
   */
  private extractComponentsRuleBased(prompt: string, assetType?: Asset['type']): PromptComponent[] {
    const components: PromptComponent[] = [];
    const words = prompt.toLowerCase().split(/\s+/);

    // Simple keyword-based extraction
    const styleKeywords = ['photorealistic', 'cartoon', 'anime', 'oil painting', 'watercolor', 'sketch'];
    const lightingKeywords = ['golden hour', 'dramatic lighting', 'soft light', 'harsh shadows'];
    const qualityKeywords = ['4k', '8k', 'high resolution', 'detailed', 'sharp'];

    // Extract style components
    styleKeywords.forEach(keyword => {
      if (prompt.toLowerCase().includes(keyword)) {
        components.push({
          id: uuidv4(),
          type: 'style',
          label: 'Art Style',
          value: keyword,
          weight: 7
        });
      }
    });

    // Extract lighting components
    lightingKeywords.forEach(keyword => {
      if (prompt.toLowerCase().includes(keyword)) {
        components.push({
          id: uuidv4(),
          type: 'lighting',
          label: 'Lighting',
          value: keyword,
          weight: 6
        });
      }
    });

    // Extract quality components
    qualityKeywords.forEach(keyword => {
      if (prompt.toLowerCase().includes(keyword)) {
        components.push({
          id: uuidv4(),
          type: 'quality',
          label: 'Quality',
          value: keyword,
          weight: 5
        });
      }
    });

    // Add subject component (everything else)
    if (components.length === 0 || !components.some(c => c.type === 'subject')) {
      components.unshift({
        id: uuidv4(),
        type: 'subject',
        label: 'Main Subject',
        value: prompt.split(',')[0].trim(),
        weight: 10
      });
    }

    return components;
  }

  /**
   * Score prompt quality and provide feedback
   */
  async scorePrompt(
    prompt: string,
    projectId?: string,
    assetType?: Asset['type'],
    aiConfig?: { provider: string; model: string; apiKey: string }
  ): Promise<{ score: number; feedback: string; suggestions: string[] }> {
    try {
      if (aiConfig?.provider === 'google') {
        // Use Google AI to score the prompt
        const project = projectId ? await projectService.getProjectById(projectId) : null;
        const scoringPrompt = this.buildPromptScoringRequest(prompt, assetType, project);
        
        const response = await googleAIService.generateText(
          scoringPrompt,
          { apiKey: aiConfig.apiKey, model: aiConfig.model },
          { temperature: 0.3, maxOutputTokens: 800 }
        );

        return this.parseScoreResponse(response.text);
      } else {
        // Fallback to rule-based scoring
        return this.scorePromptRuleBased(prompt, assetType);
      }
    } catch (error) {
      console.error('Failed to score prompt:', error);
      throw error;
    }
  }

  /**
   * Generate rule-based suggestions (fallback)
   */
  private generateRuleBasedSuggestions(prompt: string, assetType?: Asset['type']): PromptSuggestion[] {
    const suggestions: PromptSuggestion[] = [];

    // Check for missing quality descriptors
    if (!prompt.toLowerCase().includes('4k') && !prompt.toLowerCase().includes('high resolution')) {
      suggestions.push({
        id: uuidv4(),
        type: 'improvement',
        title: 'Add Quality Descriptors',
        description: 'Adding quality descriptors can improve the detail and resolution of generated images',
        suggestedChange: 'Add "4k, high resolution, detailed" to the end',
        confidence: 0.8,
        category: 'quality'
      });
    }

    // Check for missing lighting
    if (!prompt.toLowerCase().includes('light')) {
      suggestions.push({
        id: uuidv4(),
        type: 'improvement',
        title: 'Specify Lighting',
        description: 'Lighting specifications help create more visually appealing results',
        suggestedChange: 'Add lighting description like "golden hour lighting" or "dramatic shadows"',
        confidence: 0.7,
        category: 'lighting'
      });
    }

    return suggestions;
  }

  /**
   * Reconstruct prompt from components
   */
  private reconstructPromptFromComponents(components: PromptComponent[]): string {
    // Sort by weight (descending) and reconstruct
    const sortedComponents = components.sort((a, b) => (b.weight || 5) - (a.weight || 5));
    return sortedComponents.map(c => c.value).join(', ');
  }

  /**
   * Save prompt breakdown
   */
  private async savePromptBreakdown(breakdown: PromptBreakdown): Promise<void> {
    try {
      const breakdowns = await fileManager.readJSON<PromptBreakdown[]>(this.promptBreakdownsPath);
      breakdowns.push(breakdown);
      await fileManager.writeJSON(this.promptBreakdownsPath, breakdowns);
    } catch (error) {
      console.error('Failed to save prompt breakdown:', error);
    }
  }

  /**
   * Build prompt scoring request for AI
   */
  private buildPromptScoringRequest(prompt: string, assetType?: Asset['type'], project?: Project | null): string {
    let scoringPrompt = `Score this prompt for AI generation quality on a scale of 0-100 and provide specific feedback:

Prompt: "${prompt}"
Asset type: ${assetType || 'unknown'}`;

    if (project?.artStyle) {
      scoringPrompt += `
Project art style: ${project.artStyle.description}
Style keywords: ${project.artStyle.styleKeywords?.join(', ') || 'none'}`;
    }

    scoringPrompt += `

Evaluate based on:
- Clarity and specificity
- Technical detail appropriateness
- Style consistency
- Completeness of description
- AI generation effectiveness

Provide response in this JSON format:
{
  "score": 0-100,
  "feedback": "Detailed explanation of the score",
  "suggestions": ["specific improvement 1", "specific improvement 2", "specific improvement 3"]
}

Return only the JSON, no additional text.`;

    return scoringPrompt;
  }

  /**
   * Parse AI scoring response
   */
  private parseScoreResponse(aiResponse: string): { score: number; feedback: string; suggestions: string[] } {
    try {
      const parsed = JSON.parse(aiResponse);
      return {
        score: Math.max(0, Math.min(100, parsed.score || 0)),
        feedback: parsed.feedback || 'No feedback available',
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
      };
    } catch (error) {
      console.warn('Failed to parse AI scoring response, using fallback');
      return {
        score: 50,
        feedback: 'Unable to analyze prompt quality',
        suggestions: ['Add more specific details', 'Include quality descriptors', 'Specify style preferences']
      };
    }
  }

  /**
   * Rule-based prompt scoring (fallback)
   */
  private scorePromptRuleBased(prompt: string, assetType?: Asset['type']): { score: number; feedback: string; suggestions: string[] } {
    let score = 50; // Base score
    const suggestions: string[] = [];
    const feedback: string[] = [];

    // Check length
    if (prompt.length < 10) {
      score -= 20;
      feedback.push('Prompt is too short');
      suggestions.push('Add more descriptive details');
    } else if (prompt.length > 500) {
      score -= 10;
      feedback.push('Prompt might be too long');
      suggestions.push('Consider condensing to key elements');
    } else {
      score += 10;
      feedback.push('Good prompt length');
    }

    // Check for quality descriptors
    const qualityTerms = ['4k', '8k', 'high resolution', 'detailed', 'sharp', 'crisp'];
    if (qualityTerms.some(term => prompt.toLowerCase().includes(term))) {
      score += 15;
      feedback.push('Includes quality descriptors');
    } else {
      suggestions.push('Add quality descriptors like "4k, detailed"');
    }

    // Check for style descriptors
    const styleTerms = ['photorealistic', 'artistic', 'painting', 'sketch', 'cartoon', 'anime'];
    if (styleTerms.some(term => prompt.toLowerCase().includes(term))) {
      score += 15;
      feedback.push('Includes style information');
    } else {
      suggestions.push('Specify artistic style or rendering approach');
    }

    // Check for lighting
    const lightingTerms = ['lighting', 'light', 'shadow', 'golden hour', 'dramatic'];
    if (lightingTerms.some(term => prompt.toLowerCase().includes(term))) {
      score += 10;
      feedback.push('Includes lighting details');
    } else {
      suggestions.push('Add lighting description for better visual appeal');
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      feedback: feedback.join('. ') || 'Basic prompt structure detected',
      suggestions
    };
  }

  /**
   * Get default prompt templates
   */
  private getDefaultTemplates(): PromptTemplate[] {
    return [
      {
        id: uuidv4(),
        name: 'Landscape Photography',
        description: 'Professional landscape photography template',
        assetType: 'image',
        category: 'landscape',
        components: [
          { type: 'subject', label: 'Scene', description: 'Main landscape elements' },
          { type: 'lighting', label: 'Lighting', description: 'Time of day and lighting conditions' },
          { type: 'camera', label: 'Camera Settings', description: 'Camera angle and lens type' },
          { type: 'quality', label: 'Quality', description: 'Resolution and detail level' }
        ],
        examplePrompt: 'Majestic mountain landscape with snow-capped peaks, golden hour lighting, wide-angle shot, 4k resolution, highly detailed',
        tags: ['nature', 'mountains', 'photography'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Portrait Art',
        description: 'Artistic portrait template',
        assetType: 'image',
        category: 'portrait',
        components: [
          { type: 'subject', label: 'Subject', description: 'Person or character description' },
          { type: 'style', label: 'Art Style', description: 'Artistic style or medium' },
          { type: 'composition', label: 'Composition', description: 'Framing and pose' },
          { type: 'mood', label: 'Mood', description: 'Emotional tone' }
        ],
        examplePrompt: 'Portrait of a wise elderly person, oil painting style, close-up composition, contemplative mood, soft lighting',
        tags: ['portrait', 'art', 'character'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: 'Video Scene',
        description: 'Cinematic video scene template',
        assetType: 'video',
        category: 'cinematic',
        components: [
          { type: 'subject', label: 'Scene', description: 'Main action or subject' },
          { type: 'camera', label: 'Camera Movement', description: 'Camera motion and angles' },
          { type: 'lighting', label: 'Lighting', description: 'Cinematic lighting setup' },
          { type: 'mood', label: 'Atmosphere', description: 'Overall mood and tone' }
        ],
        examplePrompt: 'Cinematic scene of a person walking through a forest, smooth camera tracking, dramatic lighting with sun rays, mysterious atmosphere',
        tags: ['cinematic', 'nature', 'movement'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}

// Export singleton instance
export const promptManagementService = new PromptManagementService();