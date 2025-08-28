# Requirements Document

## Introduction

The Two-Step Creative Workflow is a redesign of the asset creation process that separates ideation from execution. Instead of a single "Create New Asset" modal, the workflow splits into two distinct stages: (1) Ideation & Prompt Crafting - where users translate high-level goals into concrete creative directions, and (2) Visual Generation - where approved prompts are turned into specific asset formats. This approach puts users in the director's chair, reduces wasted renders, encourages creative exploration, and creates a clear paper trail linking assets to their creative origins.

## Requirements

### Requirement 1

**User Story:** As a content creator, I want to start asset creation with a simple intent description, so that I can focus on what I want to achieve rather than technical details.

#### Acceptance Criteria

1. WHEN a user clicks "+ New Asset" from the project dashboard THEN the system SHALL display the Ideation Hub as the first screen
2. WHEN the Ideation Hub loads THEN the system SHALL present a simple, open-ended question "What is this asset for?"
3. WHEN a user types their intent (e.g., "A banner image for the website's about page") THEN the system SHALL accept free-form text input
4. WHEN a user submits their intent THEN the system SHALL proceed to generate conceptual directions
5. IF a user provides insufficient detail THEN the system SHALL prompt for clarification without being overly restrictive

### Requirement 2

**User Story:** As a content creator, I want the AI to generate multiple creative directions based on my intent, so that I can explore different conceptual approaches before committing to one.

#### Acceptance Criteria

1. WHEN a user submits their intent THEN the system SHALL generate 3-4 detailed prompt concepts using the project's Style Core
2. WHEN concepts are generated THEN the system SHALL present them as visually distinct cards with clear descriptions
3. WHEN displaying concepts THEN the system SHALL show how each direction interprets the user's original intent
4. WHEN concepts are presented THEN the system SHALL ensure each offers a meaningfully different creative approach
5. IF concept generation fails THEN the system SHALL provide fallback options or allow manual prompt creation

### Requirement 3

**User Story:** As a content creator, I want to review, edit, and refine the AI-generated prompts, so that I have full creative control over the final direction.

#### Acceptance Criteria

1. WHEN a user views concept cards THEN the system SHALL provide an "Edit" button on each card
2. WHEN a user clicks "Edit" THEN the system SHALL open a text editor with the full prompt text
3. WHEN a user edits a prompt THEN the system SHALL allow real-time text modification with immediate preview
4. WHEN a user saves prompt edits THEN the system SHALL update the concept card with the modified version
5. WHEN a user wants to revert changes THEN the system SHALL provide an option to restore the original AI-generated prompt

### Requirement 4

**User Story:** As a content creator, I want to generate additional concept ideas if the initial suggestions don't match my vision, so that I can explore more creative possibilities.

#### Acceptance Criteria

1. WHEN a user reviews the initial concepts THEN the system SHALL provide a "Suggest More" button
2. WHEN a user clicks "Suggest More" THEN the system SHALL generate a new batch of 3-4 different concepts
3. WHEN new concepts are generated THEN the system SHALL ensure they differ from previously shown ideas
4. WHEN multiple batches exist THEN the system SHALL allow users to navigate between different concept sets
5. IF the system runs out of diverse concepts THEN the system SHALL inform the user and suggest manual prompt creation

### Requirement 5

**User Story:** As a content creator, I want to select a finalized prompt and move to the generation stage, so that I can create the actual asset with confidence in the creative direction.

#### Acceptance Criteria

1. WHEN a user finds a satisfactory prompt THEN the system SHALL provide a clear "Select This Direction" button
2. WHEN a user selects a direction THEN the system SHALL transition to the Generation Canvas (Step 2)
3. WHEN transitioning to Step 2 THEN the system SHALL carry forward the selected prompt and original intent
4. WHEN a user wants to go back THEN the system SHALL provide navigation to return to the Ideation Hub
5. IF a user tries to proceed without selecting a direction THEN the system SHALL prompt them to choose or create a prompt

### Requirement 6

**User Story:** As a content creator, I want the Generation Canvas to focus on technical parameters rather than creative ideation, so that I can efficiently produce the asset in the format I need.

#### Acceptance Criteria

1. WHEN the Generation Canvas loads THEN the system SHALL display the selected prompt prominently at the top
2. WHEN the prompt is displayed THEN the system SHALL show it in a non-editable field with a clear "Back to Ideation" option for major changes
3. WHEN a user views the Generation Canvas THEN the system SHALL focus the interface on technical parameters (asset type, name, dimensions, etc.)
4. WHEN a user selects asset type THEN the system SHALL only show relevant options (Image, Video) without the previous "Prompt" option
5. WHEN the asset name field loads THEN the system SHALL pre-fill it based on the original intent but allow editing

### Requirement 7

**User Story:** As a content creator, I want to configure advanced technical parameters for my asset, so that I can control the final output specifications.

#### Acceptance Criteria

1. WHEN a user is on the Generation Canvas THEN the system SHALL provide expandable sections for advanced parameters
2. WHEN a user expands advanced options THEN the system SHALL show Style Overrides, Aspect Ratio, Resolution, and other technical settings
3. WHEN a user modifies technical parameters THEN the system SHALL maintain the core creative prompt while applying the technical specifications
4. WHEN a user is ready to generate THEN the system SHALL provide a prominent "Generate [Asset Type]" button
5. IF required technical parameters are missing THEN the system SHALL highlight them and prevent generation until completed

### Requirement 8

**User Story:** As a content creator, I want each generated asset to maintain a clear connection to its creative origin, so that I can understand and iterate on my content strategy.

#### Acceptance Criteria

1. WHEN an asset is generated THEN the system SHALL store the complete prompt that created it
2. WHEN a user views an asset in the gallery THEN the system SHALL display both the asset and its originating prompt
3. WHEN a user wants to create similar assets THEN the system SHALL allow them to reuse or modify existing prompts
4. WHEN a user reviews project assets THEN the system SHALL provide filtering and organization by prompt themes or concepts
5. WHEN an asset is displayed THEN the system SHALL show the original user intent alongside the final prompt for context

### Requirement 9

**User Story:** As a content creator, I want the two-step workflow to integrate seamlessly with existing project and style management, so that my established workflows remain intact.

#### Acceptance Criteria

1. WHEN a user starts the workflow THEN the system SHALL automatically apply the current project's Style Core to concept generation
2. WHEN concepts are generated THEN the system SHALL respect existing project style guidelines and reference materials
3. WHEN an asset is created THEN the system SHALL save it to the current project's asset gallery as before
4. WHEN a user switches between projects THEN the system SHALL maintain separate workflow states for each project
5. IF a project lacks style configuration THEN the system SHALL prompt for style setup before allowing concept generation

### Requirement 10

**User Story:** As a content creator, I want the workflow to provide clear progress indication and easy navigation, so that I understand where I am in the process and can move between steps confidently.

#### Acceptance Criteria

1. WHEN a user is in either workflow step THEN the system SHALL clearly indicate which stage they're in (Ideation vs Generation)
2. WHEN a user navigates between steps THEN the system SHALL provide smooth transitions with progress indicators
3. WHEN a user wants to abandon the workflow THEN the system SHALL provide clear exit options that return to the project dashboard
4. WHEN a user has unsaved changes THEN the system SHALL warn before navigation and offer to save progress
5. WHEN workflow errors occur THEN the system SHALL provide helpful error messages and recovery options