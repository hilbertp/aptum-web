# Mesocycle System - Quick Reference Guide

## 🎯 Core Concepts

### Field Ownership States
| State | Who Can Edit | AI Can Update | Visual Indicator |
|-------|--------------|---------------|------------------|
| **System** | Athlete | ✅ Yes | Light blue tint |
| **Athlete** | Athlete | ❌ No | Green tint |
| **Locked** | Nobody | ❌ No | Gray + 🔒 icon |

### Transitions
- System → Athlete: Athlete manually edits
- System/Athlete → Locked: Athlete clicks lock icon
- Locked → Athlete: Athlete clicks unlock icon
- Athlete → System: Never (except full rebuild)

---

## 🔄 Update Triggers

### 1. Initial Recommendation
**When**: After enough interview context  
**What**: Full plan generation  
**Fields Updated**: All fields  
**Visual**: All fields pulse once  
**Chat**: Explanation of initial recommendation

### 2. Selective Update
**When**: New interview answer arrives  
**What**: Update affected fields only  
**Fields Updated**: Only unlocked, system-owned fields related to the answer  
**Visual**: Changed fields pulse + 15s highlight  
**Chat**: Explanation of what changed and why

### 3. Model Change
**When**: Athlete selects different periodization model  
**What**: Apply model defaults  
**Fields Updated**: Model-specific fields, fixed fields  
**Visual**: Instant update, no pulse  
**Chat**: Brief confirmation

### 4. Rebuild Plan
**When**: Athlete clicks "Rebuild Plan" button  
**What**: Full regeneration based on current interview  
**Fields Updated**: All unlocked fields  
**Visual**: Changed fields pulse + highlight  
**Chat**: Comprehensive explanation

### 5. Review Strategy (No Updates)
**When**: Athlete clicks "Review Strategy" or asks in chat  
**What**: Analysis only, no automatic changes  
**Fields Updated**: None  
**Visual**: None  
**Chat**: Detailed analysis with actionable suggestions

---

## 🎨 Visual Feedback Rules

### Pulse Animation
- Duration: 0.6s
- Trigger: Any AI-initiated change
- Effect: Scale 1 → 1.05 → 1
- One pulse per change

### Highlight Animation
- Duration: 15s
- Trigger: AI updates or selective changes
- Effect: Yellow fade → transparent
- Auto-clears after duration
- Clears immediately on athlete edit

### Lock Icon
- Locked: 🔒 solid
- Unlocked: 🔓 outline (on hover)
- Position: Right side of field label
- Clickable: Toggle lock state

---

## 📋 Periodization Models

### Implemented (Priority Order)

#### 1. Simple Progression
- **Best For**: Beginners, general fitness
- **Structure**: Continuous progressive overload, no phases
- **Fields**: Weeks, Sessions/week, Focus areas
- **Constraints**: Min 4 weeks, 2-7 sessions/week

#### 2. Classical Linear
- **Best For**: Intermediate lifters, off-season
- **Structure**: Volume → Intensity over time
- **Fields**: + Build:Deload ratio
- **Constraints**: Min 6 weeks, 3:1 or 4:1 ratio

#### 3. Block Periodization
- **Best For**: Advanced athletes, competition prep
- **Structure**: Accumulation → Intensification → Realization
- **Fields**: + Phase lengths
- **Constraints**: Min 6 weeks, each phase 2-4 weeks

#### 4. Undulating
- **Best For**: Intermediate+, variety seekers
- **Structure**: Daily or weekly variation in volume & intensity
- **Fields**: + Variation pattern (daily/weekly)
- **Constraints**: Min 4 weeks, 3+ sessions/week

#### 5. Polarized
- **Best For**: Endurance athletes, hybrid training
- **Structure**: 80% low intensity + 20% high intensity
- **Fields**: + Intensity distribution
- **Constraints**: Min 6 weeks, 4+ sessions/week

#### 6-9. Advanced Models (Phase 2)
- ATR (Accumulate-Transmute-Realize)
- Conjugate (Westside-style)
- Reverse Linear (Intensity → Volume)
- Pyramidal (Volume base → Intensity peak)

---

## 🤖 AI Prompt Patterns

### Initial Recommendation
```
Context: {interview}, {profile}
Task: Generate initial mesocycle plan
Output: 
  - Recommended periodization model + reason
  - Weeks planned + reason
  - Sessions per week + reason
  - Focus areas + reason
  - Session allocations
  - Build:deload ratio
Constraints: Must fit athlete's availability and experience
```

### Selective Update
```
Context: {current_plan}, {interview}, {new_slot}
Task: Update plan based on new information
Output:
  - Which fields are affected
  - New values for updateable fields only
  - Clear reasoning for each change
Constraints: Only update unlocked, system-owned fields
```

### Review Strategy
```
Context: {current_plan}, {interview}, {profile}
Task: Comprehensive analysis, no changes
Output:
  - Overall assessment
  - Strengths
  - Weaknesses
  - Specific suggestions (field, current, suggested, reason)
  - Alternative models if applicable
  - Warnings for risky combinations
```

---

## 🧪 Testing Scenarios

### Scenario 1: Happy Path
1. Answer interview questions
2. AI generates initial plan → verify all fields populated + pulsed
3. Edit one field → verify ownership change, no AI update
4. Continue chat → verify selective update respects ownership
5. Lock a field → verify it stays locked during rebuild
6. Rebuild plan → verify only unlocked fields change
7. Review strategy → verify analysis appears, no auto-changes

### Scenario 2: Model Switching
1. Complete initial plan (model A)
2. Manually edit 3 fields
3. Lock 1 field
4. Switch to model B
5. Verify: edited fields preserved, locked field preserved, model-specific fields updated

### Scenario 3: Review & Apply
1. Complete plan
2. Request review
3. Verify multiple suggestions appear
4. Apply one suggestion → field unlocks, value updates, ownership = athlete
5. Verify: applied suggestion doesn't trigger additional AI updates

### Scenario 4: Edge Cases
- No API key → manual mode only
- Conflicting constraints → warning message
- Model incompatible with locked fields → error + suggestion
- Rapid edits → debounce, only final value used
- Network failure → graceful retry

---

## 📱 Mobile Differences

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Layout | Side-by-side panels | Tab switcher |
| Navigation | Scroll independent | Swipe between tabs |
| Fields | Standard size | Larger touch targets |
| Highlight | 15s duration | 10s duration |
| Model selector | Dropdown | Bottom sheet |
| Lock icon | Hover to show | Always visible |

---

## 🚨 Common Pitfalls & Solutions

### Pitfall 1: Silent AI Changes
**Problem**: AI updates a field without athlete noticing  
**Solution**: Always pulse + highlight + chat message

### Pitfall 2: Ownership Confusion
**Problem**: Athlete doesn't understand why field won't update  
**Solution**: Clear visual states, tooltip on hover, help text

### Pitfall 3: Lock State Not Persisted
**Problem**: Locked fields reset after reload  
**Solution**: Persist ownership state in plan schema, save to storage

### Pitfall 4: Highlight Overlaps
**Problem**: Multiple highlights at once are confusing  
**Solution**: Each field manages its own highlight timer independently

### Pitfall 5: Stale Plan After Model Switch
**Problem**: Values incompatible with new model  
**Solution**: Validate plan after switch, show warnings, suggest fixes

---

## 🔧 Developer Cheat Sheet

### Adding a New Periodization Model

1. **Define model** in `periodization.ts`:
```typescript
export const MODELS = {
  // ...
  my_model: {
    name: 'My Model',
    description: '...',
    requiredFields: [...],
    fixedFields: {...},
    constraints: {...},
    phases: [...]
  }
}
```

2. **Add validation** in `planEngine.ts`:
```typescript
export function validateMyModel(plan: EnhancedPlan): ValidationResult {
  // Check constraints
  // Return { valid: boolean, errors: string[] }
}
```

3. **Add UI fields** in `PlanRecommendation.tsx`:
```typescript
{model === 'my_model' && (
  <PlanField
    label="Model-Specific Field"
    value={plan.myField.value}
    ownership={plan.myField.ownership}
    // ...
  />
)}
```

4. **Update AI prompt** to know about the new model

### Creating a Custom PlanField Type

```typescript
interface CustomFieldProps extends PlanFieldProps {
  customProp: any
}

export function CustomField({ customProp, ...planFieldProps }: CustomFieldProps) {
  return (
    <PlanField {...planFieldProps}>
      {/* Custom rendering */}
    </PlanField>
  )
}
```

### Triggering Selective Update

```typescript
// In conversation handler
const newSlot = {
  question: '...',
  answer: '...',
  relatedFields: ['sessionsPerWeek', 'focusAreas']
}

planStore.addInterviewSlot(newSlot)
// Store automatically determines if selective update needed
```

### Manually Highlighting a Field

```typescript
planStore.highlightField('weeksPlanned', 15000) // 15 seconds
```

---

## 📚 Key Files Reference

| File | Purpose |
|------|---------|
| `src/schemas/product.ts` | Enhanced plan schema, PlanField types |
| `src/services/periodization.ts` | Model definitions, validation |
| `src/services/planEngine.ts` | Core plan manipulation logic |
| `src/services/coach.ts` | AI prompts, plan generation |
| `src/stores/plan.ts` | Zustand store for plan state |
| `src/pages/onboarding/Goals.tsx` | Main UI for Step 4 |
| `src/components/PlanField.tsx` | Reusable field component |
| `src/components/PeriodizationModelSelector.tsx` | Model dropdown |
| `src/utils/animations.ts` | Pulse/highlight utilities |

---

## 🎯 Acceptance Criteria Checklist

### User Story 1: Initial AI Recommendation
- [ ] Plan auto-populates after sufficient interview context
- [ ] No button press required
- [ ] Coach message explains recommendation
- [ ] All fields editable (unless model requires fixed)

### User Story 2: Multiple Periodization Models
- [ ] Dropdown contains all 9 models
- [ ] UI updates instantly on model selection
- [ ] Model-specific fields appear/disappear correctly
- [ ] AI doesn't override selected model

### User Story 3: AI Model Recommendation
- [ ] AI selects appropriate model based on profile
- [ ] Dropdown auto-selects and pulses
- [ ] Coach explains model choice
- [ ] Athlete can override immediately

### User Story 4: Manual Edits Override AI
- [ ] All fields manually editable
- [ ] Edited field becomes athlete-owned
- [ ] AI never changes athlete-owned fields
- [ ] Manual edit removes highlights

### User Story 5: Locking Fields
- [ ] Lock icon visible on all fields
- [ ] Toggle changes lock state
- [ ] Locked fields visually distinct
- [ ] Locked fields never change from AI

### User Story 6: Visual & Conversational Transparency
- [ ] AI changes cause pulse animation
- [ ] Highlights last 15 seconds
- [ ] Coach message for every change
- [ ] No silent updates

### User Story 7: Rebuild Plan
- [ ] "Rebuild Plan" button visible
- [ ] Sends all context to AI
- [ ] Updates only unlocked fields
- [ ] Changed fields pulse and highlight
- [ ] Coach explains changes

### User Story 8: Selective Updates
- [ ] Only affected fields change
- [ ] Irrelevant fields stay same
- [ ] Only system-owned, unlocked fields updated
- [ ] AI explains reasoning

### User Story 9: No Daily Calendars
- [ ] Step 4 shows only macro levers
- [ ] No daily/weekly calendar view
- [ ] Clean, focused UI

### User Story 10: Conversation & Plan Connected
- [ ] Conversation left, plan right (desktop)
- [ ] Independent scrolling
- [ ] Mobile tab switcher works
- [ ] Mentioned fields pulse in sync

### User Story 11: Review Strategy
- [ ] "Review Strategy" button/command available
- [ ] AI analyzes without changing plan
- [ ] Analysis shows weaknesses and suggestions
- [ ] Suggestions not auto-applied
- [ ] Can manually apply suggestions

---

## 💡 Tips for Implementation

1. **Start with one model** (Simple Progression) and get the full flow working
2. **Build the PlanField component first** - everything depends on it
3. **Mock AI responses** initially to avoid rate limits during development
4. **Test ownership transitions thoroughly** - this is the most complex part
5. **Add lots of console.logs** for debugging state changes
6. **Use React DevTools** to inspect store state in real-time
7. **Test on mobile early** - layout differences are significant
8. **Write E2E tests as you go** - catches regression bugs immediately
9. **Get UX feedback on ownership clarity** - users must understand it intuitively
10. **Performance test with 100+ interview messages** - ensure no slowdown
