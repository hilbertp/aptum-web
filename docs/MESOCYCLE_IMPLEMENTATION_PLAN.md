# Implementation Plan: Intelligent Mesocycle Generation

## Epic Overview
Build a conversational mesocycle planning system that balances AI recommendations with athlete agency, supporting multiple periodization models and transparent, reversible changes.

---

## Architecture Overview

### Data Model Changes

#### 1. Enhanced Plan Schema (`src/schemas/product.ts`)
```typescript
// Extend existing Plan schema
PlanField {
  value: T
  ownership: 'system' | 'athlete' | 'locked'
  lastModified: timestamp
  modifiedBy: 'ai' | 'athlete'
  highlight: boolean
  highlightUntil?: timestamp
}

PeriodizationModel: 'simple_progression' | 'classical_linear' | 'block' | 
                    'atr' | 'undulating' | 'conjugate' | 'reverse' | 
                    'polarized' | 'pyramidal'

EnhancedPlan {
  // Existing fields...
  
  // New structured fields
  weeksPlanned: PlanField<number>
  sessionsPerWeek: PlanField<number>
  focusAreas: PlanField<string[]>
  sessionAllocations: PlanField<Record<string, number>>
  buildToDeloadRatio: PlanField<string>  // e.g., "3:1", "4:1"
  periodizationModel: PlanField<PeriodizationModel>
  
  // Model-specific configurations
  phaseLengths?: PlanField<number[]>  // For block, ATR, etc.
  intensityDistribution?: PlanField<{low: number, mod: number, high: number}>  // For polarized
  
  // Metadata
  aiRecommendationReason: string
  lastReviewDate?: timestamp
  reviewFeedback?: string[]
}
```

#### 2. Interview State Schema
```typescript
InterviewSlot {
  question: string
  answer: string
  timestamp: timestamp
  relatedFields: string[]  // Which plan fields this affects
}

InterviewContext {
  slots: InterviewSlot[]
  completeness: number  // 0-100%
  triggersInitialPlan: boolean
}
```

#### 3. Change History
```typescript
PlanChangeEvent {
  timestamp: timestamp
  field: string
  oldValue: any
  newValue: any
  trigger: 'ai_initial' | 'ai_update' | 'athlete_edit' | 'rebuild'
  reason: string
}
```

---

## Component Architecture

### Phase 1: Core UI Components (Week 1)

#### Component Tree
```
Goals Page (Step 4)
├── GoalsInterview (Left Panel)
│   ├── ChatHistory
│   ├── ChatInput
│   └── ResetInterviewButton
│
└── PlanRecommendation (Right Panel)
    ├── PlanHeader
    │   ├── AIRecommendationBadge
    │   └── RebuildPlanButton
    │
    ├── PeriodizationModelSelector
    │   ├── ModelDropdown
    │   └── ModelInfoTooltip
    │
    ├── PlanFields
    │   ├── WeeksPlannedField
    │   ├── SessionsPerWeekField
    │   ├── FocusAreasField
    │   ├── SessionAllocationsField
    │   ├── BuildDeloadRatioField
    │   └── (Model-specific fields)
    │
    ├── ReviewStrategyButton
    └── PlanExplanation
```

#### New Components to Build

**1. `PlanField` Component**
```typescript
interface PlanFieldProps {
  label: string
  value: any
  ownership: 'system' | 'athlete' | 'locked'
  highlight: boolean
  onValueChange: (newValue: any) => void
  onLockToggle: () => void
  disabled?: boolean
  type: 'number' | 'text' | 'select' | 'multiselect'
  options?: any[]
}
```
- Renders with lock/unlock icon
- Shows ownership state visually
- Pulse animation when highlight=true
- Auto-removes highlight after 15s
- Different styling for locked/athlete-owned/system-owned

**2. `PeriodizationModelSelector`**
- Dropdown with 9 models
- Info icon with model descriptions
- Pulse animation on AI recommendation
- Shows "AI Recommended" badge

**3. `PlanRecommendation` Container**
- Two-column layout (desktop)
- Tab switcher (mobile)
- Syncs scroll position with conversation highlights
- Warning banner when API key missing

**4. `ReviewStrategyPanel`**
- Can be triggered by button or chat
- Shows analysis in conversation
- Lists weaknesses, suggestions, alternatives
- No auto-apply, all manual or unlock+rebuild

---

## Phase 2: Service Layer (Week 1-2)

### 1. `src/services/periodization.ts` (NEW)
```typescript
// Model definitions and constraints
interface ModelDefinition {
  name: string
  description: string
  requiredFields: string[]
  fixedFields?: Record<string, any>
  constraints: {
    minWeeks?: number
    maxWeeks?: number
    minSessions?: number
    maxSessions?: number
    allowedRatios?: string[]
  }
  phases?: PhaseDefinition[]
}

export const MODELS: Record<PeriodizationModel, ModelDefinition> = {
  simple_progression: {...},
  classical_linear: {...},
  block: {...},
  atr: {...},
  undulating: {...},
  conjugate: {...},
  reverse: {...},
  polarized: {...},
  pyramidal: {...}
}

export function validatePlanForModel(plan: Plan, model: PeriodizationModel): ValidationResult
export function getModelRecommendation(interview: InterviewContext, profile: Profile): PeriodizationModel
export function applyModelDefaults(model: PeriodizationModel): Partial<Plan>
```

### 2. `src/services/planEngine.ts` (NEW)
```typescript
// Core plan manipulation logic
export function initializePlan(interview: InterviewContext, profile: Profile): EnhancedPlan
export function updatePlanField(plan: EnhancedPlan, field: string, value: any, source: 'ai' | 'athlete'): EnhancedPlan
export function lockField(plan: EnhancedPlan, field: string): EnhancedPlan
export function unlockField(plan: EnhancedPlan, field: string): EnhancedPlan
export function rebuildPlan(plan: EnhancedPlan, interview: InterviewContext, lockedFields: string[]): Promise<EnhancedPlan>
export function reviewStrategy(plan: EnhancedPlan, interview: InterviewContext): Promise<StrategyReview>
```

### 3. Enhanced `src/services/coach.ts`
```typescript
// Add new prompt templates
export const COACH_PROMPTS = {
  initial_recommendation: `...`,
  explain_model_choice: `...`,
  explain_field_update: `...`,
  review_strategy: `...`,
  suggest_adjustments: `...`
}

export async function generateInitialPlan(interview: InterviewContext, profile: Profile): Promise<{
  plan: EnhancedPlan
  explanation: string
}>

export async function explainChange(field: string, oldValue: any, newValue: any, reason: string): Promise<string>

export async function reviewCurrentStrategy(plan: EnhancedPlan, interview: InterviewContext): Promise<{
  analysis: string
  weaknesses: string[]
  suggestions: Suggestion[]
  alternativeModels?: PeriodizationModel[]
}>

export async function selectiveUpdate(
  plan: EnhancedPlan, 
  interview: InterviewContext, 
  newSlot: InterviewSlot
): Promise<{
  updates: Record<string, any>
  reasoning: string
}>
```

---

## Phase 3: State Management (Week 2)

### Enhanced Store: `src/stores/plan.ts` (NEW)
```typescript
interface PlanStore {
  // State
  currentPlan: EnhancedPlan | null
  interview: InterviewContext
  changeHistory: PlanChangeEvent[]
  highlightedFields: Set<string>
  
  // Actions
  initializePlan: (interview: InterviewContext, profile: Profile) => Promise<void>
  updateField: (field: string, value: any, source: 'ai' | 'athlete') => void
  lockField: (field: string) => void
  unlockField: (field: string) => void
  toggleLock: (field: string) => void
  
  selectModel: (model: PeriodizationModel) => void
  rebuildPlan: () => Promise<void>
  reviewStrategy: () => Promise<StrategyReview>
  
  addInterviewSlot: (slot: InterviewSlot) => void
  resetInterview: () => void
  
  // Highlight management
  highlightField: (field: string, duration: number) => void
  clearHighlight: (field: string) => void
  
  // History
  undo: () => void
  canUndo: () => boolean
}
```

---

## Phase 4: Conversation Integration (Week 2-3)

### Interview Flow Updates

#### Initial Recommendation Trigger
```typescript
// In coach.ts or interview.ts
function shouldTriggerInitialPlan(interview: InterviewContext): boolean {
  const requiredSlots = ['goals', 'experience', 'availability', 'constraints']
  return requiredSlots.every(slot => 
    interview.slots.some(s => s.relatedFields.includes(slot))
  )
}

// In Goals component
useEffect(() => {
  if (shouldTriggerInitialPlan(interview) && !currentPlan) {
    generateInitialPlan()
  }
}, [interview])
```

#### Selective Update Logic
```typescript
// When new answer arrives
async function handleNewAnswer(slot: InterviewSlot) {
  if (!currentPlan) return
  
  // Determine which fields this answer affects
  const affectedFields = slot.relatedFields
  
  // Filter to only unlocked, system-owned fields
  const updateableFields = affectedFields.filter(field => 
    currentPlan[field].ownership === 'system' || 
    currentPlan[field].ownership === 'locked'
  )
  
  if (updateableFields.length === 0) return
  
  // Request selective update from AI
  const { updates, reasoning } = await selectiveUpdate(currentPlan, interview, slot)
  
  // Apply updates with highlights
  Object.entries(updates).forEach(([field, value]) => {
    updateField(field, value, 'ai')
    highlightField(field, 15000)
  })
  
  // Add coach message explaining the change
  addCoachMessage(reasoning)
}
```

---

## Phase 5: Visual Feedback System (Week 3)

### Animation & Highlight Utilities: `src/utils/animations.ts`
```typescript
export const pulseAnimation = {
  initial: { scale: 1 },
  animate: { scale: [1, 1.05, 1] },
  transition: { duration: 0.6, ease: 'easeInOut' }
}

export const highlightAnimation = {
  initial: { backgroundColor: 'transparent' },
  animate: { backgroundColor: ['#fef3c7', 'transparent'] },
  transition: { duration: 15, ease: 'easeOut' }
}
```

### CSS Classes
```css
/* Field ownership states */
.field-system { /* Light blue tint */ }
.field-athlete { /* Green tint */ }
.field-locked { /* Gray with lock icon */ }

/* Highlight states */
.field-highlight {
  animation: highlight 15s ease-out forwards;
}

@keyframes highlight {
  0% { background-color: #fef3c7; }
  100% { background-color: transparent; }
}

.field-pulse {
  animation: pulse 0.6s ease-in-out;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

---

## Phase 6: Periodization Model Implementations (Week 3-4)

### Model Definitions

Each model gets:
1. Definition object in `periodization.ts`
2. Validation rules
3. Default values
4. Phase structure (if applicable)
5. UI adaptations

**Example: Block Periodization**
```typescript
{
  name: 'Block',
  description: 'Concentrated loading of specific abilities in sequential blocks (e.g., Accumulation → Intensification → Realization)',
  requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'phaseLengths'],
  constraints: {
    minWeeks: 6,
    maxWeeks: 16,
    minSessions: 3,
    maxSessions: 7,
    allowedRatios: ['2:1', '3:1']
  },
  phases: [
    { name: 'Accumulation', minWeeks: 2, maxWeeks: 4, focus: ['volume', 'technical'] },
    { name: 'Intensification', minWeeks: 2, maxWeeks: 4, focus: ['intensity', 'strength'] },
    { name: 'Realization', minWeeks: 1, maxWeeks: 3, focus: ['peak', 'power'] }
  ]
}
```

**Priority Implementation Order:**
1. Simple Progression (baseline)
2. Classical Linear (most common)
3. Block (for advanced athletes)
4. Undulating (popular alternative)
5. Polarized (endurance athletes)
6. ATR, Conjugate, Reverse, Pyramidal (specialized)

---

## Phase 7: Review Strategy Feature (Week 4)

### Implementation

**Trigger Points:**
1. Button in plan panel: "Review My Current Strategy"
2. Chat command: "Can you review my plan?" or similar

**AI Review Prompt:**
```typescript
const REVIEW_PROMPT = `
You are reviewing an athlete's mesocycle plan. Analyze for:
- Volume vs recovery balance
- Intensity distribution appropriateness
- Model fit for athlete's profile and constraints
- Missing considerations (injury history, game schedule, etc.)
- Unrealistic combinations

Current Plan:
{plan}

Interview Context:
{interview}

Athlete Profile:
{profile}

Return JSON:
{
  "analysis": "Overall assessment",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": [
    {"field": "sessionsPerWeek", "current": 5, "suggested": 4, "reason": "..."},
    ...
  ],
  "alternativeModels": ["undulating", "block"],
  "warnings": ["..."]
}
`
```

**UI Display:**
- Analysis appears as coach message
- Suggestions formatted as actionable items
- Each suggestion has "Apply" button that:
  - Unlocks the field
  - Sets the suggested value
  - Marks as athlete-owned
- "Apply All Suggestions" button available

---

## Implementation Timeline

### Week 1: Foundation
**Days 1-2: Data Model**
- [ ] Extend Plan schema with PlanField wrapper
- [ ] Add PeriodizationModel types
- [ ] Create InterviewContext schema
- [ ] Build change history tracking

**Days 3-5: Core Components**
- [ ] Build PlanField component with lock/unlock
- [ ] Build PeriodizationModelSelector
- [ ] Create PlanRecommendation container
- [ ] Implement highlight/pulse animations

**Days 6-7: Basic Services**
- [ ] Create periodization.ts with model definitions (first 3 models)
- [ ] Create planEngine.ts with core functions
- [ ] Add state management store

### Week 2: AI Integration
**Days 8-10: Coach Service Updates**
- [ ] Implement generateInitialPlan
- [ ] Implement selectiveUpdate
- [ ] Add explain change logic
- [ ] Test with mock responses

**Days 11-14: Conversation Flow**
- [ ] Hook initial recommendation trigger
- [ ] Implement selective update on new answers
- [ ] Add coach messages for all changes
- [ ] Test full onboarding flow

### Week 3: Polish & Models
**Days 15-17: Visual Feedback**
- [ ] Refine animations
- [ ] Add ownership state styling
- [ ] Implement 15s highlight auto-clear
- [ ] Mobile responsive layout

**Days 18-21: Additional Models**
- [ ] Implement remaining 6 periodization models
- [ ] Add model-specific UI fields
- [ ] Validate each model's constraints
- [ ] Add model info tooltips

### Week 4: Review & Testing
**Days 22-24: Review Strategy Feature**
- [ ] Build review strategy prompt
- [ ] Create UI for displaying analysis
- [ ] Add suggestion application logic
- [ ] Test review quality

**Days 25-28: Testing & Bug Fixes**
- [ ] End-to-end testing of all flows
- [ ] Edge case handling
- [ ] Performance optimization
- [ ] Documentation updates

---

## Testing Strategy

### Unit Tests
- [ ] PlanField ownership transitions
- [ ] Lock/unlock behavior
- [ ] Highlight timer management
- [ ] Model validation logic
- [ ] Selective update field filtering

### Integration Tests
- [ ] Initial plan generation
- [ ] Model switching
- [ ] Rebuild with locked fields
- [ ] Conversation + plan synchronization
- [ ] Review strategy workflow

### E2E Tests
- [ ] Complete onboarding with AI recommendations
- [ ] Manual override all fields
- [ ] Lock fields and rebuild
- [ ] Switch models mid-flow
- [ ] Review strategy and apply suggestions

### UX Testing
- [ ] Highlight visibility and duration
- [ ] Lock icon clarity
- [ ] Model dropdown usability
- [ ] Mobile conversation/plan switcher
- [ ] Coach message clarity

---

## Risk Mitigation

### High Risk Areas
1. **AI response inconsistency**
   - Mitigation: Strong prompt engineering, response validation, fallbacks
   
2. **State synchronization bugs**
   - Mitigation: Centralized state management, immutable updates, audit logs
   
3. **Performance with complex plans**
   - Mitigation: Debounce AI calls, optimistic UI updates, lazy loading
   
4. **User confusion about ownership**
   - Mitigation: Clear visual indicators, tooltips, help text, onboarding tips

### Rollback Plan
- Feature flag for new system
- Can fall back to simple manual entry
- Preserve existing plan schema compatibility

---

## Success Metrics

### Functional
- [ ] All 11 user stories pass acceptance criteria
- [ ] Zero silent AI changes
- [ ] All fields lockable and overrideable
- [ ] 9 models implemented and validated
- [ ] Review strategy produces actionable insights

### UX
- [ ] Athletes understand ownership within 30 seconds
- [ ] Lock/unlock actions are intuitive
- [ ] AI explanations are clear and concise
- [ ] Mobile layout is usable

### Performance
- [ ] Initial plan generation < 3s (p50)
- [ ] Selective updates < 2s (p50)
- [ ] Review strategy < 5s (p50)
- [ ] Highlight animations 60fps

---

## Dependencies

### External
- OpenAI API (BYOK) - required for all AI features
- Existing interview system
- Profile data from onboarding
- Storage layer for plan persistence

### Internal
- Zustand store setup
- Existing coach service
- UI component library
- Animation utilities (Framer Motion if available)

---

## Open Questions

1. **Model Complexity**: Should we implement all 9 models in MVP, or start with 3-4 and add more based on usage?
   - Recommendation: Start with 4 (Simple, Linear, Block, Undulating)

2. **Undo/Redo**: Should we provide undo/redo for plan changes?
   - Recommendation: Yes, simple undo stack for last 10 changes

3. **Plan Versioning**: Should we save plan snapshots at each major change?
   - Recommendation: Yes, save before rebuild and before review application

4. **Mobile Layout**: Tabs or single scrolling view?
   - Recommendation: Tabs with sticky switcher at top

5. **AI Provider**: OpenAI only or support multiple?
   - Recommendation: OpenAI only for MVP (existing pattern)

---

## Next Steps

1. **Review this plan** with team/stakeholder
2. **Prioritize** which models to implement first
3. **Design UI mockups** for the new components
4. **Set up feature branch** for development
5. **Create tracking tickets** for each phase
6. **Begin Week 1 implementation**
