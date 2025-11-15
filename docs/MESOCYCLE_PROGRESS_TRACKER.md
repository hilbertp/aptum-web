# Mesocycle Implementation - Progress Tracker

**Epic Start Date**: [TBD]  
**Target Completion**: [TBD]  
**Current Phase**: Planning  

---

## Week 1: Foundation (Days 1-7)

### Days 1-2: Data Model ⏳
- [ ] Extend Plan schema with PlanField wrapper type
- [ ] Add PeriodizationModel enum and types
- [ ] Create InterviewContext schema with relatedFields
- [ ] Build PlanChangeEvent schema for history tracking
- [ ] Update product.ts with EnhancedPlan interface
- [ ] Write unit tests for schema validation

**Blockers**: None  
**Notes**: 

---

### Days 3-5: Core Components ⏳
- [ ] Build `PlanField` component
  - [ ] Ownership state rendering (system/athlete/locked)
  - [ ] Lock/unlock toggle button
  - [ ] Pulse animation integration
  - [ ] Highlight animation (15s auto-clear)
  - [ ] Value editing for different types (number/text/select/multiselect)
  - [ ] Accessibility features (ARIA labels, keyboard nav)
- [ ] Build `PeriodizationModelSelector` component
  - [ ] Dropdown with 9 models
  - [ ] Model info tooltips
  - [ ] Pulse animation on AI recommendation
  - [ ] "AI Recommended" badge
- [ ] Build `PlanRecommendation` container
  - [ ] Two-panel layout (desktop)
  - [ ] Tab switcher (mobile)
  - [ ] API key warning banner
  - [ ] Header with rebuild button
- [ ] Create animation utilities in `src/utils/animations.ts`
- [ ] Write Storybook stories for components

**Blockers**:  
**Notes**: 

---

### Days 6-7: Basic Services ⏳
- [ ] Create `src/services/periodization.ts`
  - [ ] Define MODELS object with first 4 models
    - [ ] Simple Progression
    - [ ] Classical Linear
    - [ ] Block Periodization
    - [ ] Undulating
  - [ ] Implement validatePlanForModel()
  - [ ] Implement getModelRecommendation()
  - [ ] Implement applyModelDefaults()
  - [ ] Write unit tests for each model
- [ ] Create `src/services/planEngine.ts`
  - [ ] Implement initializePlan()
  - [ ] Implement updatePlanField()
  - [ ] Implement lockField() / unlockField()
  - [ ] Implement rebuildPlan() (skeleton)
  - [ ] Write unit tests for field operations
- [ ] Create `src/stores/plan.ts` with Zustand
  - [ ] Define PlanStore interface
  - [ ] Implement state properties
  - [ ] Implement basic actions
  - [ ] Add highlight management
  - [ ] Write store tests

**Blockers**:  
**Notes**: 

---

## Week 2: AI Integration (Days 8-14)

### Days 8-10: Coach Service Updates ⏳
- [ ] Extend `src/services/coach.ts`
  - [ ] Add COACH_PROMPTS for mesocycle
    - [ ] initial_recommendation
    - [ ] explain_model_choice
    - [ ] explain_field_update
    - [ ] selective_update
  - [ ] Implement generateInitialPlan()
  - [ ] Implement selectiveUpdate()
  - [ ] Implement explainChange()
  - [ ] Add response validation and error handling
  - [ ] Write tests with mocked OpenAI responses
- [ ] Update `src/services/llm.ts` if needed
  - [ ] Ensure embeddings work for KB retrieval
  - [ ] Add any new utility functions

**Blockers**:  
**Notes**: 

---

### Days 11-14: Conversation Flow ⏳
- [ ] Update `src/pages/onboarding/Goals.tsx`
  - [ ] Integrate PlanRecommendation component
  - [ ] Wire up interview → plan generation trigger
  - [ ] Implement shouldTriggerInitialPlan() logic
  - [ ] Add coach message synchronization
  - [ ] Handle initial plan generation
  - [ ] Handle selective updates on new answers
  - [ ] Add loading states
  - [ ] Mobile responsive layout
- [ ] Update `src/services/interview.ts` (if exists)
  - [ ] Track relatedFields for each question
  - [ ] Calculate interview completeness
- [ ] Implement field highlighting on coach mention
- [ ] Write E2E test for initial recommendation flow
- [ ] Write E2E test for selective update flow

**Blockers**:  
**Notes**: 

---

## Week 3: Polish & Models (Days 15-21)

### Days 15-17: Visual Feedback ⏳
- [ ] Refine pulse animation
  - [ ] Test across browsers
  - [ ] Ensure 60fps performance
  - [ ] Add reduced motion support
- [ ] Refine highlight animation
  - [ ] 15s auto-clear implementation
  - [ ] Clear on manual edit
  - [ ] Handle overlapping highlights
- [ ] Implement ownership state styling
  - [ ] System: light blue tint
  - [ ] Athlete: green tint
  - [ ] Locked: gray + lock icon
  - [ ] Hover states
  - [ ] Focus states for accessibility
- [ ] Mobile responsive layout
  - [ ] Test tab switcher
  - [ ] Test touch interactions
  - [ ] Test field editing on mobile
  - [ ] Optimize performance
- [ ] Add tooltips and help text
- [ ] User testing session

**Blockers**:  
**Notes**: 

---

### Days 18-21: Additional Models ⏳
- [ ] Add remaining 5 periodization models
  - [ ] Polarized
  - [ ] ATR (Accumulate-Transmute-Realize)
  - [ ] Conjugate
  - [ ] Reverse Linear
  - [ ] Pyramidal
- [ ] Implement model-specific UI fields
  - [ ] Phase lengths (Block, ATR)
  - [ ] Intensity distribution (Polarized)
  - [ ] Max/Dynamic effort split (Conjugate)
  - [ ] Other model-specific parameters
- [ ] Add model validation rules
- [ ] Add model info tooltips with descriptions
- [ ] Update AI prompts to handle all models
- [ ] Write tests for each new model
- [ ] Write migration for existing plans

**Blockers**:  
**Notes**: 

---

## Week 4: Review & Testing (Days 22-28)

### Days 22-24: Review Strategy Feature ⏳
- [ ] Extend coach.ts with review strategy
  - [ ] reviewCurrentStrategy() function
  - [ ] Review analysis prompt
  - [ ] Parse AI response into structured format
- [ ] Add "Review Strategy" button to UI
- [ ] Add chat command detection for review
- [ ] Build review results display
  - [ ] Analysis text
  - [ ] Strengths list
  - [ ] Weaknesses list
  - [ ] Suggestions with Apply buttons
  - [ ] Alternative models section
  - [ ] Warnings
- [ ] Implement suggestion application
  - [ ] Unlock field
  - [ ] Set suggested value
  - [ ] Mark as athlete-owned
  - [ ] No cascade updates
- [ ] Add "Apply All Suggestions" option
- [ ] Write E2E test for review flow

**Blockers**:  
**Notes**: 

---

### Days 25-28: Testing & Bug Fixes ⏳
- [ ] End-to-end testing
  - [ ] Happy path: complete onboarding with AI
  - [ ] Model switching preserves athlete edits
  - [ ] Lock/unlock behavior correct
  - [ ] Rebuild respects locked fields
  - [ ] Review strategy doesn't auto-apply
  - [ ] Manual mode without API key
- [ ] Edge case testing
  - [ ] Conflicting constraints
  - [ ] Invalid model combinations
  - [ ] Network failures
  - [ ] Rapid field edits
  - [ ] Stale data handling
- [ ] Performance optimization
  - [ ] Profile AI call duration
  - [ ] Optimize render cycles
  - [ ] Test with 100+ messages
  - [ ] Check memory leaks
- [ ] Accessibility audit
  - [ ] Screen reader testing
  - [ ] Keyboard navigation
  - [ ] Color contrast
  - [ ] Focus management
- [ ] Browser compatibility testing
  - [ ] Chrome, Firefox, Safari, Edge
  - [ ] Mobile browsers
- [ ] User acceptance testing
- [ ] Bug fixes and refinements
- [ ] Documentation updates

**Blockers**:  
**Notes**: 

---

## Post-Launch (Week 5+)

### Phase 2 Enhancements
- [ ] Undo/Redo functionality
- [ ] Plan versioning and snapshots
- [ ] Export/import plans
- [ ] Share plans with coach
- [ ] Plan comparison view
- [ ] Historical plan performance tracking
- [ ] A/B testing different AI prompts
- [ ] User feedback collection
- [ ] Analytics integration

---

## Metrics to Track

### Development Velocity
- Stories completed per week: ___
- Blockers encountered: ___
- Average story completion time: ___

### Quality Metrics
- Unit test coverage: ___%
- Integration test coverage: ___%
- E2E test coverage: ___%
- Bugs found in testing: ___
- Bugs found post-launch: ___

### Performance Metrics
- Initial plan generation time (p50): ___s
- Initial plan generation time (p95): ___s
- Selective update time (p50): ___s
- Review strategy time (p50): ___s
- UI response time: ___ms

### User Metrics (Post-Launch)
- Onboarding completion rate: ___%
- Average time in Goals step: ___min
- % users who manually edit plan: ___%
- % users who lock fields: ___%
- % users who use rebuild: ___%
- % users who use review: ___%
- Model selection distribution: [stats]

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation | Status |
|------|-----------|--------|------------|--------|
| AI response inconsistency | High | High | Strong prompts, validation, fallbacks | Open |
| State sync bugs | Medium | High | Centralized store, immutable updates | Open |
| Performance issues | Medium | Medium | Debouncing, optimistic UI, profiling | Open |
| User confusion | High | High | Clear visuals, tooltips, user testing | Open |
| Model complexity | Medium | Medium | Start with 4 models, iterate | Open |
| Mobile UX poor | Medium | High | Early mobile testing, responsive design | Open |
| API rate limits | Low | Medium | Debouncing, caching, graceful degradation | Open |
| Lock state bugs | Medium | High | Comprehensive tests, state machine | Open |

---

## Decision Log

| Date | Decision | Rationale | Impact |
|------|----------|-----------|--------|
| [Date] | Use Zustand for state management | Already in use, simple API | Consistent with app |
| [Date] | 15s highlight duration | Balance between noticeable and not annoying | UX |
| [Date] | Start with 4 models | MVP scope, can expand | Timeline |
| [Date] | No auto-apply for review suggestions | Athlete agency is paramount | UX principle |
| [Date] | Field-level locking vs plan-level | More granular control | Flexibility |

---

## Team Assignments

| Area | Owner | Status |
|------|-------|--------|
| Data Model | [Name] | Not Started |
| UI Components | [Name] | Not Started |
| Services Layer | [Name] | Not Started |
| State Management | [Name] | Not Started |
| AI Integration | [Name] | Not Started |
| Testing | [Name] | Not Started |
| Documentation | [Name] | Not Started |

---

## Stakeholder Updates

### Week 1 Update
**Completed**: [List]  
**In Progress**: [List]  
**Blocked**: [List]  
**Next Week**: [Plan]

### Week 2 Update
**Completed**: [List]  
**In Progress**: [List]  
**Blocked**: [List]  
**Next Week**: [Plan]

### Week 3 Update
**Completed**: [List]  
**In Progress**: [List]  
**Blocked**: [List]  
**Next Week**: [Plan]

### Week 4 Update
**Completed**: [List]  
**In Progress**: [List]  
**Blocked**: [List]  
**Next Week**: [Plan]

---

## Definition of Done

A feature is "Done" when:
- [ ] Code written and peer reviewed
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E test written and passing
- [ ] Accessibility requirements met
- [ ] Mobile responsive
- [ ] Browser compatibility verified
- [ ] Performance targets met
- [ ] Documentation updated
- [ ] Product owner acceptance
- [ ] Deployed to staging
- [ ] No critical bugs

---

## Retrospective Notes

### What Went Well
- 

### What Could Be Improved
- 

### Action Items
- 

---

**Last Updated**: [Date]  
**Updated By**: [Name]
