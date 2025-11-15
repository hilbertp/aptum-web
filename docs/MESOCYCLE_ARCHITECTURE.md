# Mesocycle System Architecture

## System Flow Diagram

```mermaid
graph TD
    A["Athlete answers interview questions"] --> B{"Enough context?"}
    B -->|Yes| C["AI generates initial plan"]
    B -->|No| A
    
    C --> D["Plan displayed in right panel"]
    D --> E["AI explains recommendation"]
    
    E --> F{"Athlete action"}
    
    F -->|"Edit field"| G["Mark as athlete-owned"]
    F -->|"Lock field"| H["Mark as locked"]
    F -->|"Select model"| I["Update plan structure"]
    F -->|"Continue chatting"| J["New interview answer"]
    F -->|"Rebuild plan"| K["AI updates unlocked fields"]
    F -->|"Review strategy"| L["AI analyzes plan"]
    
    G --> M["Remove highlight"]
    H --> M
    I --> N["Apply model defaults"]
    
    J --> O{"Affects plan fields?"}
    O -->|Yes| P["Selective update"]
    O -->|No| A
    
    P --> Q["Update unlocked, system-owned fields"]
    Q --> R["Highlight changed fields"]
    R --> S["Coach explains changes"]
    
    K --> Q
    
    L --> T["Display analysis + suggestions"]
    T --> U{"Apply suggestion?"}
    U -->|Yes| V["Unlock field, set value, mark athlete-owned"]
    U -->|No| F
    
    V --> F
    N --> F
    M --> F
    S --> F
```

## Data Flow

```mermaid
sequenceDiagram
    participant A as Athlete
    participant UI as Goals UI
    participant Store as Plan Store
    participant Coach as Coach Service
    participant Engine as Plan Engine
    
    A->>UI: Answers interview questions
    UI->>Store: addInterviewSlot()
    
    Store->>Store: Check if enough context
    
    alt Initial Plan
        Store->>Coach: generateInitialPlan(interview, profile)
        Coach->>Coach: Recommend periodization model
        Coach->>Engine: initializePlan()
        Engine-->>Coach: Enhanced plan with all fields
        Coach-->>Store: {plan, explanation}
        Store->>UI: Update plan state
        UI->>UI: Pulse all fields
        UI->>A: Display plan + coach message
    end
    
    A->>UI: Manually edit field
    UI->>Store: updateField(field, value, 'athlete')
    Store->>Store: Mark field as athlete-owned
    Store->>Store: Clear highlight
    Store-->>UI: Updated plan
    
    A->>UI: Lock field
    UI->>Store: lockField(field)
    Store-->>UI: Field locked
    
    A->>UI: Continue chatting
    UI->>Store: addInterviewSlot()
    Store->>Coach: selectiveUpdate(plan, interview, newSlot)
    Coach->>Coach: Determine affected fields
    Coach->>Coach: Filter to updateable fields
    Coach-->>Store: {updates, reasoning}
    
    loop For each update
        Store->>Store: updateField(field, value, 'ai')
        Store->>Store: highlightField(field, 15000)
    end
    
    Store-->>UI: Updated plan
    UI->>A: Pulse changed fields + coach message
    
    A->>UI: Click "Rebuild Plan"
    UI->>Store: rebuildPlan()
    Store->>Engine: rebuildPlan(plan, interview, lockedFields)
    Engine->>Coach: Generate complete plan update
    Coach-->>Engine: Updated field values
    Engine-->>Store: New plan with highlights
    Store-->>UI: Updated plan
    UI->>A: Pulse all changed fields + explanation
    
    A->>UI: Click "Review Strategy"
    UI->>Store: reviewStrategy()
    Store->>Coach: reviewCurrentStrategy(plan, interview)
    Coach->>Coach: Analyze plan comprehensively
    Coach-->>Store: {analysis, weaknesses, suggestions}
    Store-->>UI: Review results
    UI->>A: Display analysis in chat
```

## Component Hierarchy

```mermaid
graph TB
    Goals["Goals Page #40;Step 4#41;"]
    
    Goals --> Left["Left Panel: Interview"]
    Goals --> Right["Right Panel: Plan"]
    
    Left --> Chat["ChatHistory"]
    Left --> Input["ChatInput"]
    Left --> Reset["ResetInterviewButton"]
    
    Right --> Header["PlanHeader"]
    Right --> Model["PeriodizationModelSelector"]
    Right --> Fields["PlanFieldsContainer"]
    Right --> Actions["ActionButtons"]
    Right --> Explain["PlanExplanation"]
    
    Header --> Badge["AIRecommendationBadge"]
    Header --> Rebuild["RebuildPlanButton"]
    
    Model --> Dropdown["ModelDropdown"]
    Model --> Info["ModelInfoTooltip"]
    
    Fields --> WP["WeeksPlannedField"]
    Fields --> SPW["SessionsPerWeekField"]
    Fields --> FA["FocusAreasField"]
    Fields --> SA["SessionAllocationsField"]
    Fields --> BD["BuildDeloadRatioField"]
    Fields --> MS["ModelSpecificFields"]
    
    WP --> PF1["PlanField Component"]
    SPW --> PF2["PlanField Component"]
    FA --> PF3["PlanField Component"]
    SA --> PF4["PlanField Component"]
    BD --> PF5["PlanField Component"]
    
    PF1 --> Lock1["LockToggle"]
    PF1 --> Highlight1["HighlightAnimation"]
    
    Actions --> Review["ReviewStrategyButton"]
    Actions --> Continue["ContinueButton"]
```

## State Management Architecture

```mermaid
graph LR
    subgraph "Plan Store"
        State["State"]
        Actions["Actions"]
        Computed["Computed Values"]
    end
    
    subgraph "State Properties"
        Plan["currentPlan: EnhancedPlan"]
        Interview["interview: InterviewContext"]
        History["changeHistory: PlanChangeEvent[]"]
        Highlights["highlightedFields: Set"]
    end
    
    subgraph "Actions"
        Init["initializePlan()"]
        Update["updateField()"]
        Lock["lockField()"]
        SelectM["selectModel()"]
        Rebuild["rebuildPlan()"]
        Review["reviewStrategy()"]
    end
    
    subgraph "Computed"
        Locked["lockedFields[]"]
        Athlete["athleteOwnedFields[]"]
        Editable["editableFields[]"]
        Complete["planCompleteness%"]
    end
    
    State --> Plan
    State --> Interview
    State --> History
    State --> Highlights
    
    Actions --> Init
    Actions --> Update
    Actions --> Lock
    Actions --> SelectM
    Actions --> Rebuild
    Actions --> Review
    
    Computed --> Locked
    Computed --> Athlete
    Computed --> Editable
    Computed --> Complete
```

## Field Ownership State Machine

```mermaid
stateDiagram-v2
    [*] --> System: AI creates field
    
    System --> Athlete: Manual edit
    System --> Locked: Lock toggle
    System --> System: AI update #40;allowed#41;
    
    Athlete --> Locked: Lock toggle
    Athlete --> Athlete: Manual edit
    Athlete --> System: Never #40;unless rebuild#41;
    
    Locked --> Athlete: Unlock toggle
    Locked --> Locked: AI update #40;blocked#41;
    Locked --> Locked: Manual edit #40;blocked#41;
    
    note right of System
        AI can update
        Shows light blue tint
    end note
    
    note right of Athlete
        AI cannot update
        Shows green tint
        Manual edits allowed
    end note
    
    note right of Locked
        AI cannot update
        Manual edits blocked
        Shows gray + lock icon
    end note
```

## Periodization Models Overview

```mermaid
graph TB
    Models["9 Periodization Models"]
    
    Models --> SP["Simple Progression"]
    Models --> CL["Classical Linear"]
    Models --> Block["Block"]
    Models --> ATR["ATR"]
    Models --> Undu["Undulating"]
    Models --> Conj["Conjugate"]
    Models --> Rev["Reverse"]
    Models --> Pol["Polarized"]
    Models --> Pyr["Pyramidal"]
    
    SP --> SP1["Progressive overload<br/>No distinct phases"]
    CL --> CL1["Volume → Intensity<br/>Linear progression"]
    Block --> B1["Accumulation →<br/>Intensification →<br/>Realization"]
    ATR --> A1["Accumulate →<br/>Transmute →<br/>Realize"]
    Undu --> U1["Daily/Weekly<br/>variation in<br/>volume & intensity"]
    Conj --> C1["Concurrent training<br/>Max effort + Dynamic<br/>effort + Repetition"]
    Rev --> R1["Intensity → Volume<br/>Opposite of linear"]
    Pol --> P1["Low intensity +<br/>High intensity<br/>Minimal moderate"]
    Pyr --> Py1["Volume base →<br/>Intensity peak<br/>Visual pyramid"]
```

## Review Strategy Flow

```mermaid
flowchart TD
    Start["Athlete triggers review"] --> Gather["Gather current plan + interview + profile"]
    
    Gather --> AI["Send to AI for analysis"]
    
    AI --> Analyze["AI analyzes:"]
    Analyze --> V1["Volume/recovery balance"]
    Analyze --> V2["Intensity distribution"]
    Analyze --> V3["Model appropriateness"]
    Analyze --> V4["Missing considerations"]
    Analyze --> V5["Unrealistic combinations"]
    
    V1 & V2 & V3 & V4 & V5 --> Results["AI returns:"]
    
    Results --> R1["Overall analysis"]
    Results --> R2["Strengths"]
    Results --> R3["Weaknesses"]
    Results --> R4["Specific suggestions"]
    Results --> R5["Alternative models"]
    Results --> R6["Warnings"]
    
    R1 & R2 & R3 & R4 & R5 & R6 --> Display["Display in conversation"]
    
    Display --> Sug["For each suggestion:"]
    Sug --> S1["Show current vs suggested"]
    Sug --> S2["Show reasoning"]
    Sug --> S3["Provide 'Apply' button"]
    
    S3 --> Choice{"Athlete applies?"}
    Choice -->|Yes| Apply["Unlock field<br/>Set value<br/>Mark athlete-owned"]
    Choice -->|No| Keep["Keep current value"]
    
    Apply --> End["Continue planning"]
    Keep --> End
```

## Critical Interaction Patterns

### Pattern 1: Initial Recommendation
1. Athlete answers questions → accumulates in InterviewContext
2. System checks if `shouldTriggerInitialPlan()` = true
3. AI called once with full context
4. Plan appears instantly in right panel
5. All fields pulse once
6. Coach message explains the recommendation
7. Athlete can immediately start editing

### Pattern 2: Incremental Update
1. Athlete asks new question or provides new info
2. System determines which fields this affects
3. Only unlocked, system-owned fields are candidates
4. AI returns minimal update (not full plan)
5. Only changed fields pulse and highlight
6. Coach explains what changed and why
7. 15s timer starts for highlight removal

### Pattern 3: Model Switch
1. Athlete selects different model from dropdown
2. System applies model defaults immediately (no AI call)
3. Model-specific fields appear/disappear
4. Fixed fields update automatically
5. Athlete-owned and locked fields preserved where possible
6. Warning shown if values incompatible with new model

### Pattern 4: Rebuild
1. Athlete clicks "Rebuild Plan"
2. System sends everything: interview, profile, current plan, locked fields
3. AI regenerates all unlocked fields
4. All changed fields pulse and highlight
5. Coach explains complete rationale
6. Change history logged

### Pattern 5: Review & Apply
1. Athlete clicks "Review Strategy"
2. AI analyzes without changing anything
3. Results appear as structured coach message
4. Each suggestion is actionable
5. "Apply" unlocks field → sets value → marks athlete-owned
6. Multiple suggestions can be applied independently
7. No bulk changes without explicit consent

---

## Key Design Principles

### 1. Transparency
- Every AI change is visible and explained
- No silent modifications
- Clear ownership states at all times

### 2. Agency
- Athlete always has final say
- Can override any recommendation
- Lock mechanism protects choices

### 3. Progressive Disclosure
- Simple by default
- Model complexity hidden until needed
- Advanced features available but not required

### 4. Conversation-First
- Chat drives the experience
- Plan updates feel conversational
- AI is a coach, not a dictator

### 5. Reversibility
- Can undo changes
- Can reset interview
- Can rebuild from scratch

---

## Performance Considerations

### Optimization Targets
- **Initial plan**: < 3s (includes AI call)
- **Selective update**: < 2s (smaller AI call)
- **Review strategy**: < 5s (analysis only)
- **UI updates**: < 100ms (local state changes)
- **Highlight animations**: 60fps

### Caching Strategy
- Cache model definitions (never change)
- Cache AI responses for identical inputs (session-scoped)
- Debounce rapid field edits (500ms)
- Optimistic UI updates for manual edits

### Progressive Enhancement
- Plan editor works without AI (manual mode)
- Graceful degradation if API key missing
- Offline support for manual edits
- Sync when connection restored

---

## Accessibility

- Keyboard navigation for all fields
- Screen reader announcements for AI changes
- High contrast mode support
- Focus management for modals/dropdowns
- ARIA labels for ownership states

---

## Mobile Adaptations

### Layout
- Single column scroll (default)
- Tab switcher: [Conversation] [Plan]
- Sticky tab bar at top
- Full-width fields for easier editing

### Interactions
- Larger touch targets for lock icons
- Swipe to switch tabs
- Pull-to-refresh interview
- Bottom sheet for model selector

### Performance
- Reduce animation duration (10s highlight instead of 15s)
- Lazy load model info tooltips
- Virtualize long chat history
