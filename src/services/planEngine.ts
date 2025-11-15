import {
  EnhancedPlan,
  PlanField,
  FieldOwnership,
  InterviewContext,
  Profile,
  PlanChangeEvent,
  PeriodizationModel
} from '../schemas/product';
import {
  getModelRecommendation,
  applyModelDefaults,
  validatePlanForModel,
  MODELS
} from './periodization';

/**
 * Create a new PlanField with proper metadata
 */
export function createPlanField<T>(
  value: T,
  ownership: FieldOwnership = 'system',
  modifiedBy: 'ai' | 'athlete' = 'ai'
): PlanField<T> {
  return {
    value,
    ownership,
    lastModified: Date.now(),
    modifiedBy,
    highlight: false
  };
}

/**
 * Initialize a new enhanced plan from interview context and profile
 */
export function initializePlan(interview: InterviewContext, profile: Profile): Partial<EnhancedPlan> {
  const now = Date.now();

  // Recommend a periodization model based on interview
  const recommendedModel = getModelRecommendation(interview, profile);

  // Apply model defaults
  const modelDefaults = applyModelDefaults(recommendedModel, profile, interview);

  // Initialize base plan structure
  const plan: Partial<EnhancedPlan> = {
    version: '0.1.0',
    cycle: {
      weeks: modelDefaults.weeksPlanned?.value || 8,
      startISO: new Date().toISOString().split('T')[0] as string
    },
    profileSnapshot: profile,
    changeHistory: [],
    ...modelDefaults
  };

  // Add initial change event
  const initialEvent: PlanChangeEvent = {
    timestamp: now,
    field: 'initial_plan',
    oldValue: null,
    newValue: plan,
    trigger: 'ai_initial',
    reason: 'Initial plan generated from interview context'
  };

  plan.changeHistory = [initialEvent];

  return plan;
}

/**
 * Update a specific field in the plan with ownership tracking
 */
export function updatePlanField(
  plan: Partial<EnhancedPlan>,
  field: keyof EnhancedPlan,
  value: any,
  source: 'ai' | 'athlete',
  reason: string = ''
): Partial<EnhancedPlan> {
  const now = Date.now();

  // Get current field value
  const currentField = (plan as any)[field] as PlanField<any> | undefined;
  const oldValue = currentField?.value;

  // Determine if update is allowed based on ownership
  if (currentField) {
    if (currentField.ownership === 'locked') {
      console.warn(`Field "${field}" is locked and cannot be updated`);
      return plan;
    }
    if (currentField.ownership === 'athlete' && source === 'ai') {
      console.warn(`Field "${field}" is athlete-owned and cannot be updated by AI`);
      return plan;
    }
  }

  // Determine new ownership
  let newOwnership: FieldOwnership = source === 'athlete' ? 'athlete' : 'system';
  if (currentField?.ownership === 'locked') {
    newOwnership = 'locked'; // Preserve locked state
  }

  // Create updated field
  const updatedField: PlanField<any> = {
    value,
    ownership: newOwnership,
    lastModified: now,
    modifiedBy: source,
    highlight: source === 'ai', // Highlight AI changes
    highlightUntil: source === 'ai' ? now + 15000 : undefined // 15s highlight for AI changes
  };

  // Create change event
  const changeEvent: PlanChangeEvent = {
    timestamp: now,
    field: field as string,
    oldValue,
    newValue: value,
    trigger: source === 'athlete' ? 'athlete_edit' : 'ai_update',
    reason: reason || `${source === 'athlete' ? 'Athlete' : 'AI'} updated ${field}`
  };

  // Return updated plan
  return {
    ...plan,
    [field]: updatedField,
    changeHistory: [...(plan.changeHistory || []), changeEvent]
  };
}

/**
 * Update multiple fields at once (for batch AI updates)
 */
export function updateMultipleFields(
  plan: Partial<EnhancedPlan>,
  updates: Record<string, any>,
  source: 'ai' | 'athlete',
  reason: string = ''
): Partial<EnhancedPlan> {
  let updatedPlan = { ...plan };

  Object.entries(updates).forEach(([field, value]) => {
    updatedPlan = updatePlanField(updatedPlan, field as keyof EnhancedPlan, value, source, reason);
  });

  return updatedPlan;
}

/**
 * Lock a field to prevent any modifications
 */
export function lockField(plan: Partial<EnhancedPlan>, field: keyof EnhancedPlan): Partial<EnhancedPlan> {
  const currentField = (plan as any)[field] as PlanField<any> | undefined;

  if (!currentField) {
    console.warn(`Field "${field}" does not exist and cannot be locked`);
    return plan;
  }

  const now = Date.now();
  const lockedField: PlanField<any> = {
    ...currentField,
    ownership: 'locked',
    lastModified: now,
    modifiedBy: 'athlete',
    highlight: false,
    highlightUntil: undefined
  };

  const changeEvent: PlanChangeEvent = {
    timestamp: now,
    field: field as string,
    oldValue: currentField.ownership,
    newValue: 'locked',
    trigger: 'athlete_edit',
    reason: `Field "${field}" locked by athlete`
  };

  return {
    ...plan,
    [field]: lockedField,
    changeHistory: [...(plan.changeHistory || []), changeEvent]
  };
}

/**
 * Unlock a field to allow modifications
 */
export function unlockField(plan: Partial<EnhancedPlan>, field: keyof EnhancedPlan): Partial<EnhancedPlan> {
  const currentField = (plan as any)[field] as PlanField<any> | undefined;

  if (!currentField) {
    console.warn(`Field "${field}" does not exist and cannot be unlocked`);
    return plan;
  }

  if (currentField.ownership !== 'locked') {
    console.warn(`Field "${field}" is not locked`);
    return plan;
  }

  const now = Date.now();
  const unlockedField: PlanField<any> = {
    ...currentField,
    ownership: 'athlete', // Unlocking marks as athlete-owned
    lastModified: now,
    modifiedBy: 'athlete',
    highlight: false,
    highlightUntil: undefined
  };

  const changeEvent: PlanChangeEvent = {
    timestamp: now,
    field: field as string,
    oldValue: 'locked',
    newValue: 'athlete',
    trigger: 'athlete_edit',
    reason: `Field "${field}" unlocked by athlete`
  };

  return {
    ...plan,
    [field]: unlockedField,
    changeHistory: [...(plan.changeHistory || []), changeEvent]
  };
}

/**
 * Toggle lock state of a field
 */
export function toggleFieldLock(plan: Partial<EnhancedPlan>, field: keyof EnhancedPlan): Partial<EnhancedPlan> {
  const currentField = (plan as any)[field] as PlanField<any> | undefined;

  if (!currentField) {
    console.warn(`Field "${field}" does not exist`);
    return plan;
  }

  if (currentField.ownership === 'locked') {
    return unlockField(plan, field);
  } else {
    return lockField(plan, field);
  }
}

/**
 * Clear highlight from a field (usually called after timeout)
 */
export function clearHighlight(plan: Partial<EnhancedPlan>, field: keyof EnhancedPlan): Partial<EnhancedPlan> {
  const currentField = (plan as any)[field] as PlanField<any> | undefined;

  if (!currentField || !currentField.highlight) {
    return plan;
  }

  const clearedField: PlanField<any> = {
    ...currentField,
    highlight: false,
    highlightUntil: undefined
  };

  return {
    ...plan,
    [field]: clearedField
  };
}

/**
 * Clear all expired highlights based on current time
 */
export function clearExpiredHighlights(plan: Partial<EnhancedPlan>): Partial<EnhancedPlan> {
  const now = Date.now();
  let updatedPlan = { ...plan };

  // Check all fields for expired highlights
  const fieldsToClear: (keyof EnhancedPlan)[] = [];

  Object.keys(plan).forEach(key => {
    const field = (plan as any)[key];
    if (field && typeof field === 'object' && 'highlight' in field && 'highlightUntil' in field) {
      if (field.highlight && field.highlightUntil && now >= field.highlightUntil) {
        fieldsToClear.push(key as keyof EnhancedPlan);
      }
    }
  });

  fieldsToClear.forEach(field => {
    updatedPlan = clearHighlight(updatedPlan, field);
  });

  return updatedPlan;
}

/**
 * Get all fields that are currently locked
 */
export function getLockedFields(plan: Partial<EnhancedPlan>): string[] {
  const lockedFields: string[] = [];

  Object.entries(plan).forEach(([key, value]) => {
    if (value && typeof value === 'object' && 'ownership' in value) {
      if ((value as PlanField<any>).ownership === 'locked') {
        lockedFields.push(key);
      }
    }
  });

  return lockedFields;
}

/**
 * Get all fields that are athlete-owned
 */
export function getAthleteOwnedFields(plan: Partial<EnhancedPlan>): string[] {
  const athleteFields: string[] = [];

  Object.entries(plan).forEach(([key, value]) => {
    if (value && typeof value === 'object' && 'ownership' in value) {
      if ((value as PlanField<any>).ownership === 'athlete') {
        athleteFields.push(key);
      }
    }
  });

  return athleteFields;
}

/**
 * Get all fields that are system-owned (can be updated by AI)
 */
export function getSystemOwnedFields(plan: Partial<EnhancedPlan>): string[] {
  const systemFields: string[] = [];

  Object.entries(plan).forEach(([key, value]) => {
    if (value && typeof value === 'object' && 'ownership' in value) {
      if ((value as PlanField<any>).ownership === 'system') {
        systemFields.push(key);
      }
    }
  });

  return systemFields;
}

/**
 * Change periodization model and apply new defaults
 */
export function changePeriodizationModel(
  plan: Partial<EnhancedPlan>,
  newModel: PeriodizationModel,
  profile: Profile,
  interview: InterviewContext
): Partial<EnhancedPlan> {
  const now = Date.now();

  // Get defaults for new model
  const modelDefaults = applyModelDefaults(newModel, profile, interview);

  // Start with current plan
  let updatedPlan = { ...plan };

  // Update model field
  updatedPlan.periodizationModel = {
    value: newModel,
    ownership: 'system',
    lastModified: now,
    modifiedBy: 'athlete',
    highlight: true,
    highlightUntil: now + 15000
  };

  // Apply model defaults for fields that are system-owned
  Object.entries(modelDefaults).forEach(([key, value]) => {
    if (key === 'periodizationModel') return; // Already updated above

    const currentField = (updatedPlan as any)[key] as PlanField<any> | undefined;

    // Only update if field doesn't exist OR is system-owned
    if (!currentField || currentField.ownership === 'system') {
      (updatedPlan as any)[key] = value;
    }
    // Preserve athlete-owned and locked fields
  });

  // Validate new plan
  const validation = validatePlanForModel(updatedPlan, newModel);

  // Add change event
  const changeEvent: PlanChangeEvent = {
    timestamp: now,
    field: 'periodizationModel',
    oldValue: plan.periodizationModel?.value,
    newValue: newModel,
    trigger: 'athlete_edit',
    reason: `Switched to ${MODELS[newModel].name}. ${validation.warnings.length > 0 ? 'Warnings: ' + validation.warnings.join(', ') : ''}`
  };

  updatedPlan.changeHistory = [...(updatedPlan.changeHistory || []), changeEvent];

  return updatedPlan;
}

/**
 * Calculate plan completeness (0-100%)
 */
export function calculatePlanCompleteness(plan: Partial<EnhancedPlan>): number {
  if (!plan.periodizationModel?.value) return 0;

  const model = plan.periodizationModel.value;
  const modelDef = MODELS[model];
  const requiredFields = modelDef.requiredFields;

  let filledCount = 0;
  requiredFields.forEach(field => {
    if ((plan as any)[field]?.value !== undefined) {
      filledCount++;
    }
  });

  return Math.round((filledCount / requiredFields.length) * 100);
}

/**
 * Get summary of plan for display
 */
export function getPlanSummary(plan: Partial<EnhancedPlan>): {
  model: string;
  weeks: number;
  sessionsPerWeek: number;
  focusAreas: string[];
  completeness: number;
  lockedFieldCount: number;
  athleteOwnedFieldCount: number;
} {
  return {
    model: plan.periodizationModel?.value || 'none',
    weeks: plan.weeksPlanned?.value || 0,
    sessionsPerWeek: plan.sessionsPerWeek?.value || 0,
    focusAreas: plan.focusAreas?.value || [],
    completeness: calculatePlanCompleteness(plan),
    lockedFieldCount: getLockedFields(plan).length,
    athleteOwnedFieldCount: getAthleteOwnedFields(plan).length
  };
}

/**
 * Undo last change (simple implementation - can be enhanced with full undo stack)
 */
export function undoLastChange(plan: Partial<EnhancedPlan>): Partial<EnhancedPlan> {
  const history = plan.changeHistory || [];
  if (history.length === 0) {
    console.warn('No changes to undo');
    return plan;
  }

  // Get last change
  const lastChange = history[history.length - 1];
  if (!lastChange) {
    return plan;
  }

  // Revert the field to old value
  if (lastChange.field !== 'initial_plan' && lastChange.oldValue !== undefined) {
    const fieldKey = lastChange.field as keyof EnhancedPlan;
    const currentField = (plan as any)[fieldKey] as PlanField<any> | undefined;

    if (currentField) {
      (plan as any)[fieldKey] = {
        ...currentField,
        value: lastChange.oldValue,
        lastModified: Date.now(),
        modifiedBy: 'athlete',
        highlight: false
      };
    }
  }

  // Remove last change from history
  return {
    ...plan,
    changeHistory: history.slice(0, -1)
  };
}
