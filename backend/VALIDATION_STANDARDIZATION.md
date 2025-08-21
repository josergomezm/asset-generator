# API Validation Standardization Summary

This document outlines the standardized validation approach for all API endpoints in the backend.

## Validation Structure

All routes use the `validate()` middleware with the following structure:
```typescript
validate({
  body?: ZodSchema,     // For request body validation
  query?: ZodSchema,    // For query parameter validation  
  params?: ZodSchema    // For route parameter validation
})
```

## Standardized Validation Schemas

### Common Parameter Schemas
- `CommonParams.id` - UUID validation for `:id` parameters
- `CommonParams.projectId` - UUID validation for `:projectId` parameters
- `CommonParams.assetId` - UUID validation for `:assetId` parameters
- `CommonParams.jobId` - UUID validation for `:jobId` parameters

### Common Query Schemas
- `CommonQuery.pagination` - Standard pagination with `page` and `limit`

### Flexible Parameter Schemas (for testing)
- `FlexibleParams.*` - Same as CommonParams but allows any string (used in test environment)

## Route Validation Status

### ✅ Projects Routes (`/api/projects`)
- `GET /` - ✅ Query validation (pagination)
- `POST /` - ✅ Body validation (CreateProjectRequestSchema)
- `GET /:id` - ✅ Params validation (CommonParams.id)
- `PUT /:id` - ✅ Params + Body validation
- `DELETE /:id` - ✅ Params validation (CommonParams.id)
- `POST /:id/style` - ✅ Params validation (CommonParams.id)
- `GET /:projectId/assets` - ✅ Params validation (CommonParams.projectId)
- `POST /:projectId/assets` - ✅ Params + Body validation

### ✅ Assets Routes (`/api/assets`)
- `GET /:id` - ✅ Params validation (flexible/strict based on environment)
- `PUT /:id` - ✅ Params + Body validation
- `DELETE /:id` - ✅ Params validation
- `GET /:id/download` - ✅ Params validation

### ✅ Generation Routes (`/api/generate`)
- `POST /image` - ✅ Body validation (generateImageBody)
- `POST /video` - ✅ Body validation (generateVideoBody)
- `POST /prompt` - ✅ Body validation (generatePromptBody)
- `GET /status/:jobId` - ✅ Params validation (CommonParams.jobId)
- `DELETE /cancel/:jobId` - ✅ Params validation (CommonParams.jobId)

### ✅ Prompts Routes (`/api/prompts`)
- `POST /breakdown` - ✅ Body validation (BreakdownPromptRequestSchema)
- `POST /suggestions` - ✅ Body validation (GeneratePromptSuggestionsRequestSchema)
- `POST /score` - ✅ Body validation (GeneratePromptSuggestionsRequestSchema)
- `GET /templates` - ✅ Query validation (getTemplatesQuery)
- `POST /templates` - ✅ Body validation (CreatePromptTemplateRequestSchema)
- `GET /history/:projectId` - ✅ Params + Query validation
- `POST /history` - ✅ Body validation (SavePromptHistoryRequestSchema)

## Frontend API Client Standardization

The frontend API client (`frontend/src/services/api.ts`) is already properly structured to work with the backend validation:

### ✅ Standardized Request Patterns
1. **Body Data**: All POST/PUT requests send JSON in request body
2. **Query Parameters**: GET requests use URLSearchParams for query strings
3. **Route Parameters**: Embedded in URL paths
4. **Headers**: Consistent Content-Type and AI configuration headers

### ✅ Error Handling
- Standardized ApiError class with status, code, and details
- Retry logic for server errors (5xx) and network errors
- Proper error propagation to UI components

### ✅ Request Structure Examples

**Body Validation Example:**
```typescript
// Frontend
await apiClient.generateImage({
  projectId: "uuid",
  name: "Asset Name",
  generationPrompt: "prompt text"
});

// Backend validates with generateImageBody schema
validate({ body: generateImageBody })
```

**Query Validation Example:**
```typescript
// Frontend
await apiClient.getPromptTemplates({
  assetType: 'image',
  category: 'landscape',
  tags: ['nature', 'outdoor']
});

// Backend validates with getTemplatesQuery schema
validate({ query: getTemplatesQuery })
```

**Params Validation Example:**
```typescript
// Frontend
await apiClient.getProject("project-uuid");

// Backend validates with CommonParams.id schema
validate({ params: CommonParams.id })
```

## Validation Benefits

1. **Type Safety**: Zod schemas provide runtime type checking
2. **Consistent Error Messages**: Standardized error responses
3. **Input Sanitization**: Automatic parsing and transformation
4. **Documentation**: Schemas serve as API documentation
5. **Testing**: Flexible validation for test environments

## Best Practices

1. **Always use validation middleware** for all routes
2. **Reuse common schemas** (CommonParams, CommonQuery)
3. **Define schemas in types package** for sharing between frontend/backend
4. **Use flexible schemas in tests** to avoid UUID generation complexity
5. **Provide meaningful error messages** in schema definitions
6. **Transform query parameters** (string to number) when needed

## Missing Validations Fixed

1. ✅ Added query parameter validation for `/prompts/templates`
2. ✅ Added params + query validation for `/prompts/history/:projectId`
3. ✅ Added `/prompts/score` endpoint with proper validation
4. ✅ Added pagination validation for `/projects`
5. ✅ Added scorePrompt method to PromptManagementService and PromptController

All API endpoints now have comprehensive validation covering body, query, and parameter validation as appropriate.