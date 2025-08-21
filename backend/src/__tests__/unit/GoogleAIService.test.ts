import { GoogleAIService } from '../../services/ai/GoogleAIService';

describe('GoogleAIService', () => {
  let googleAIService: GoogleAIService;

  beforeEach(() => {
    googleAIService = new GoogleAIService();
  });

  describe('validateApiKey', () => {
    it('should return false for invalid API key format', async () => {
      const result = await googleAIService.validateApiKey('invalid-key');
      expect(result).toBe(false);
    });

    it('should handle API key validation gracefully', async () => {
      // This will fail with invalid key but should not throw
      const result = await googleAIService.validateApiKey('test-key');
      expect(typeof result).toBe('boolean');
    });
  });

  describe('buildPromptEnhancementRequest', () => {
    it('should build basic enhancement request', () => {
      const service = googleAIService as any; // Access private method for testing
      const result = service.buildPromptEnhancementRequest('test prompt');
      
      expect(result).toContain('test prompt');
      expect(result).toContain('enhance');
      expect(result).toContain('prompt engineer');
    });

    it('should include context in enhancement request', () => {
      const service = googleAIService as any;
      const result = service.buildPromptEnhancementRequest('test prompt', {
        assetType: 'image',
        artStyle: 'photorealistic',
        styleKeywords: ['detailed', 'high quality']
      });
      
      expect(result).toContain('Asset type: image');
      expect(result).toContain('Art style: photorealistic');
      expect(result).toContain('detailed, high quality');
    });
  });

  describe('parsePromptSuggestions', () => {
    it('should parse numbered list suggestions', () => {
      const service = googleAIService as any;
      const response = `1. First suggestion
2. Second suggestion
3. Third suggestion`;
      
      const result = service.parsePromptSuggestions(response);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('First suggestion');
      expect(result[1]).toBe('Second suggestion');
      expect(result[2]).toBe('Third suggestion');
    });

    it('should handle malformed responses', () => {
      const service = googleAIService as any;
      const response = `Some random text
Another line of text
Third line of text`;
      
      const result = service.parsePromptSuggestions(response);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('Some random text');
    });
  });

  describe('parsePromptScore', () => {
    it('should parse complete score response', () => {
      const service = googleAIService as any;
      const response = `SCORE: 85
FEEDBACK: This is a good prompt with clear details.
SUGGESTIONS:
- Add more specific lighting details
- Include composition guidelines
- Specify camera angle`;
      
      const result = service.parsePromptScore(response);
      
      expect(result.score).toBe(85);
      expect(result.feedback).toContain('good prompt');
      expect(result.suggestions).toHaveLength(3);
      expect(result.suggestions[0]).toBe('Add more specific lighting details');
    });

    it('should handle incomplete score response', () => {
      const service = googleAIService as any;
      const response = `SCORE: 75`;
      
      const result = service.parsePromptScore(response);
      
      expect(result.score).toBe(75);
      expect(result.feedback).toBe('No feedback available');
      expect(result.suggestions).toHaveLength(0);
    });

    it('should use default score for malformed response', () => {
      const service = googleAIService as any;
      const response = `Invalid response format`;
      
      const result = service.parsePromptScore(response);
      
      expect(result.score).toBe(50);
      expect(result.feedback).toBe('No feedback available');
    });
  });
});