# Implementation Plan

- [x] 1. Set up core data models and types





  - Create ConceptCard, IdeationSession, and PromptEdit interfaces in the types package
  - Enhance existing Asset and GenerationJob interfaces with concept linking fields
  - Add validation schemas for new data structures
  - _Requirements: 1.1, 2.1, 8.1_

- [x] 2. Implement backend concept management service





  - [x] 2.1 Create ConceptService class with core CRUD operations


    - Implement generateConcepts() method using Google AI integration
    - Add updateConcept() method for user edits
    - Create validateConcept() method for pre-generation validation
    - Write unit tests for ConceptService methods
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 2.2 Create IdeationService for workflow orchestration

    - Implement processUserIntent() method to convert intent to concepts
    - Add generateMoreConcepts() method for additional concept batches
    - Create refinePrompt() method for user prompt improvements
    - Write unit tests for IdeationService methods
    - _Requirements: 2.1, 4.1, 4.2_

- [x] 3. Create new API routes for ideation workflow





  - [x] 3.1 Implement /api/ideation routes


    - Create POST /api/ideation/concepts endpoint for concept generation
    - Add PUT /api/ideation/concepts/:id endpoint for concept updates
    - Implement POST /api/ideation/validate endpoint for concept validation
    - Add request validation middleware for all ideation endpoints
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 3.2 Enhance existing generation routes


    - Modify generation endpoints to accept conceptId parameter
    - Update GenerateAssetRequest interface to include concept data
    - Add concept linking in asset creation process
    - Write integration tests for enhanced generation flow
    - _Requirements: 5.1, 6.1, 8.1_

- [x] 4. Create ConceptCard component




  - [x] 4.1 Build basic ConceptCard.vue component


    - Create component structure with concept display
    - Implement selection state management
    - Add basic styling with Tailwind CSS classes
    - Write component unit tests
    - _Requirements: 2.2, 3.1_

  - [x] 4.2 Add editing functionality to ConceptCard



    - Implement inline prompt editing with textarea
    - Add edit/save/cancel button controls
    - Create prompt validation and character counting
    - Add edit history tracking
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 5. Create PromptEditor component





  - [x] 5.1 Build PromptEditor.vue with rich text features


    - Create textarea with syntax highlighting for prompt keywords
    - Implement real-time character count display
    - Add undo/redo functionality using browser history API
    - Write component unit tests for editing features
    - _Requirements: 3.2, 3.3_

  - [x] 5.2 Add style integration features


    - Implement style keyword suggestions based on project Style Core
    - Add keyword highlighting and autocomplete
    - Create style preview integration
    - Add validation for style consistency
    - _Requirements: 9.1, 9.2_

- [x] 6. Implement IdeationHub component





  - [x] 6.1 Create basic IdeationHub.vue structure


    - Build component layout with intent input section
    - Create concept display grid for generated concepts
    - Implement navigation controls and progress indicators
    - Add loading states and error handling UI
    - _Requirements: 1.1, 1.2, 2.1_

  - [x] 6.2 Add concept generation functionality


    - Integrate with ConceptService API for concept generation
    - Implement "Suggest More" functionality for additional batches
    - Add concept selection and validation logic
    - Create smooth transitions between concept batches
    - _Requirements: 2.1, 2.2, 4.1, 4.2_

  - [x] 6.3 Implement concept editing and refinement


    - Integrate PromptEditor component for concept editing
    - Add real-time concept preview updates
    - Implement concept validation before proceeding to generation
    - Create concept history tracking and undo functionality
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Create GenerationCanvas component





  - [x] 7.1 Build GenerationCanvas.vue basic structure


    - Create component layout with locked prompt display
    - Implement "Back to Ideation" navigation
    - Add asset type selection (Image/Video only)
    - Create technical parameter sections
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 7.2 Add technical parameter configuration


    - Implement asset name pre-filling based on user intent
    - Create advanced parameter accordion sections
    - Add form validation for required technical parameters
    - Integrate with existing generation parameter schemas
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [x] 7.3 Implement generation execution


    - Connect to enhanced generation API endpoints
    - Add concept-to-asset linking during generation
    - Implement generation progress tracking with concept context
    - Create success/error handling with concept history
    - _Requirements: 5.1, 8.1, 8.2_

- [x] 8. Modify existing generator components





  - [x] 8.1 Simplify ImageGenerator.vue for technical focus


    - Remove prompt input fields and creative brainstorming sections
    - Streamline UI to focus on technical parameters only
    - Update component to accept pre-defined prompts from concepts
    - Refactor form validation to work with concept-based workflow
    - _Requirements: 6.3, 6.4, 7.1_

  - [x] 8.2 Simplify VideoGenerator.vue for technical focus


    - Remove creative ideation elements from component
    - Focus interface on video-specific technical parameters
    - Update to work with concept-based prompt input
    - Maintain existing video generation functionality
    - _Requirements: 6.3, 6.4, 7.1_

  - [x] 8.3 Simplify PromptGenerator.vue for technical focus


    - Remove prompt brainstorming and template sections
    - Focus on prompt enhancement and technical parameters
    - Update to work with pre-defined concept prompts
    - Maintain AI analysis features for concept validation
    - _Requirements: 6.3, 6.4, 7.1_

- [x] 9. Integrate workflow with existing project system





  - [x] 9.1 Update ProjectDashboard to use new workflow


    - Replace AssetCreator modal with IdeationHub navigation
    - Update "Create Asset" button to launch two-step workflow
    - Maintain backward compatibility with existing asset display
    - Add concept history display in asset details
    - _Requirements: 9.1, 9.3, 10.1_

  - [x] 9.2 Enhance AssetGallery with concept information


    - Display concept origin information for each asset
    - Add filtering and search by concept themes
    - Implement concept reuse functionality for similar assets
    - Create concept-to-asset relationship visualization
    - _Requirements: 8.2, 8.3, 8.4_

- [x] 10. Implement workflow state management





  - [x] 10.1 Create Vuex/Pinia store for ideation workflow


    - Implement state management for current ideation session
    - Add concept batch management and navigation
    - Create workflow progress tracking
    - Add session persistence for workflow interruption recovery
    - _Requirements: 10.1, 10.2, 10.4_

  - [x] 10.2 Add workflow navigation and progress indicators


    - Implement step indicators showing Ideation vs Generation phase
    - Create smooth transitions between workflow steps
    - Add breadcrumb navigation for complex workflows
    - Implement workflow exit and resume functionality
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 11. Add comprehensive error handling





  - [x] 11.1 Implement ideation-specific error handling


    - Add fallback to template-based concepts when AI fails
    - Create manual concept creation as backup option
    - Implement graceful degradation to single-step workflow
    - Add clear error messaging with recovery suggestions
    - _Requirements: 2.3, 4.3, 4.4_

  - [x] 11.2 Add generation canvas error handling


    - Implement redirect to Ideation Hub for missing concept data
    - Add real-time validation for technical parameters
    - Create smart defaults based on concept information
    - Add progress preservation during error recovery
    - _Requirements: 7.4, 10.4_

- [-] 12. Create comprehensive test suite



  - [ ] 12.1 Write unit tests for new components


    - Test IdeationHub concept generation and selection logic
    - Test ConceptCard editing and validation functionality
    - Test GenerationCanvas parameter handling and navigation
    - Test PromptEditor text manipulation and validation
    - _Requirements: All requirements - testing coverage_

  - [ ] 12.2 Write integration tests for workflow
    - Test complete two-step workflow from intent to asset generation
    - Test API integration between ideation and generation services
    - Test error handling and recovery scenarios
    - Test workflow state persistence and restoration
    - _Requirements: All requirements - integration testing_

- [ ] 13. Performance optimization and polish
  - [ ] 13.1 Optimize concept generation performance
    - Implement concept caching for faster repeated access
    - Add lazy loading for concept batches
    - Optimize AI service calls with request batching
    - Add performance monitoring for concept generation times
    - _Requirements: 2.1, 4.1, 4.2_

  - [ ] 13.2 Polish user experience and accessibility
    - Add keyboard navigation for workflow steps
    - Implement responsive design for mobile concept editing
    - Add loading animations and micro-interactions
    - Ensure WCAG compliance for all new components
    - _Requirements: 10.1, 10.2, 10.3_

- [ ] 14. Documentation and migration
  - [ ] 14.1 Create user documentation for new workflow
    - Write user guide for two-step creative process
    - Create video tutorials for workflow demonstration
    - Add in-app help tooltips and guided tours
    - Document workflow best practices and tips
    - _Requirements: All requirements - user guidance_

  - [ ] 14.2 Implement migration strategy from old workflow
    - Create feature flag system for gradual rollout
    - Add option to use legacy single-step workflow
    - Implement data migration for existing assets to include concept history
    - Create A/B testing framework for workflow comparison
    - _Requirements: 9.1, 9.2, 9.3_