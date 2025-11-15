import { PeriodizationModel, InterviewContext, Profile, EnhancedPlan } from '../schemas/product';

/**
 * Phase definition for models with distinct blocks (e.g., Block, ATR)
 */
export interface PhaseDefinition {
  name: string;
  minWeeks: number;
  maxWeeks: number;
  focus: string[]; // Primary training focuses for this phase
  intensityRange?: [number, number]; // Optional intensity % range
}

/**
 * Validation result for plan/model compatibility
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Complete definition of a periodization model
 */
export interface ModelDefinition {
  name: string;
  description: string;
  bestFor: string[]; // Who should use this model
  requiredFields: string[]; // Plan fields that must be set
  fixedFields?: Record<string, any>; // Fields that have fixed values for this model
  constraints: {
    minWeeks?: number;
    maxWeeks?: number;
    minSessions?: number;
    maxSessions?: number;
    allowedRatios?: string[]; // Valid build:deload ratios
    requiresPhases?: boolean;
  };
  phases?: PhaseDefinition[]; // Defined phases if model has blocks
  intensityDistribution?: {
    low: number;
    moderate: number;
    high: number;
  }; // Required distribution for polarized
}

/**
 * All periodization models with their complete definitions
 */
export const MODELS: Record<PeriodizationModel, ModelDefinition> = {
  simple_progression: {
    name: 'Simple Progression',
    description: 'Continuous progressive overload without distinct phases. Best for beginners.',
    bestFor: ['Beginners', 'General fitness', 'Consistency building'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas'],
    constraints: {
      minWeeks: 4,
      maxWeeks: 16,
      minSessions: 2,
      maxSessions: 7
    }
  },

  classical_linear: {
    name: 'Classical Linear Periodization',
    description: 'Gradual transition from high volume/low intensity to low volume/high intensity over the mesocycle.',
    bestFor: ['Intermediate lifters', 'Off-season training', 'Strength focus'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'buildToDeloadRatio'],
    constraints: {
      minWeeks: 6,
      maxWeeks: 16,
      minSessions: 3,
      maxSessions: 7,
      allowedRatios: ['3:1', '4:1', '5:1']
    }
  },

  block: {
    name: 'Block Periodization',
    description: 'Sequential blocks emphasizing different abilities: Accumulation (volume) → Intensification (intensity) → Realization (peaking).',
    bestFor: ['Advanced athletes', 'Competition preparation', 'Powerlifters'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'phaseLengths', 'buildToDeloadRatio'],
    constraints: {
      minWeeks: 6,
      maxWeeks: 20,
      minSessions: 3,
      maxSessions: 8,
      allowedRatios: ['2:1', '3:1'],
      requiresPhases: true
    },
    phases: [
      {
        name: 'Accumulation',
        minWeeks: 2,
        maxWeeks: 5,
        focus: ['volume', 'hypertrophy', 'technical_work'],
        intensityRange: [60, 75]
      },
      {
        name: 'Intensification',
        minWeeks: 2,
        maxWeeks: 4,
        focus: ['intensity', 'strength', 'force'],
        intensityRange: [75, 90]
      },
      {
        name: 'Realization',
        minWeeks: 1,
        maxWeeks: 3,
        focus: ['peak', 'power', 'competition_readiness'],
        intensityRange: [85, 100]
      }
    ]
  },

  atr: {
    name: 'ATR (Accumulate-Transmute-Realize)',
    description: 'Similar to block but with emphasis on transmuting accumulated adaptations into performance.',
    bestFor: ['Advanced athletes', 'Olympic lifters', 'Throwing athletes'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'phaseLengths', 'buildToDeloadRatio'],
    constraints: {
      minWeeks: 6,
      maxWeeks: 16,
      minSessions: 3,
      maxSessions: 8,
      allowedRatios: ['2:1', '3:1'],
      requiresPhases: true
    },
    phases: [
      {
        name: 'Accumulate',
        minWeeks: 2,
        maxWeeks: 5,
        focus: ['volume', 'work_capacity', 'base_building']
      },
      {
        name: 'Transmute',
        minWeeks: 2,
        maxWeeks: 4,
        focus: ['force', 'velocity', 'transfer']
      },
      {
        name: 'Realize',
        minWeeks: 1,
        maxWeeks: 3,
        focus: ['power', 'speed', 'expression']
      }
    ]
  },

  undulating: {
    name: 'Undulating Periodization',
    description: 'Frequent variation in volume and intensity, either daily (DUP) or weekly. Prevents accommodation.',
    bestFor: ['Intermediate+', 'Variety seekers', 'Breaking plateaus'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'variationPattern'],
    constraints: {
      minWeeks: 4,
      maxWeeks: 16,
      minSessions: 3,
      maxSessions: 7
    }
  },

  conjugate: {
    name: 'Conjugate Method',
    description: 'Concurrent training of max effort, dynamic effort, and repetition methods in the same week. Westside Barbell approach.',
    bestFor: ['Powerlifters', 'Advanced lifters', 'Westside adherents'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'sessionAllocations'],
    constraints: {
      minWeeks: 4,
      maxWeeks: 52,
      minSessions: 4,
      maxSessions: 6
    },
    fixedFields: {
      sessionAllocations: {
        max_effort: 2,
        dynamic_effort: 2,
        repetition: 2
      }
    }
  },

  reverse: {
    name: 'Reverse Linear Periodization',
    description: 'Starts with high intensity/low volume and transitions to low intensity/high volume. Good for endurance athletes.',
    bestFor: ['Endurance athletes', 'Pre-season training', 'Bodybuilding'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'buildToDeloadRatio'],
    constraints: {
      minWeeks: 6,
      maxWeeks: 16,
      minSessions: 3,
      maxSessions: 7,
      allowedRatios: ['3:1', '4:1']
    }
  },

  polarized: {
    name: 'Polarized Training',
    description: 'Bimodal intensity distribution: ~80% low intensity, ~20% high intensity, minimal moderate. Evidence-based for endurance.',
    bestFor: ['Endurance athletes', 'Hybrid athletes', 'Longevity focus'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'intensityDistribution'],
    constraints: {
      minWeeks: 6,
      maxWeeks: 52,
      minSessions: 4,
      maxSessions: 12
    },
    intensityDistribution: {
      low: 75,
      moderate: 5,
      high: 20
    }
  },

  pyramidal: {
    name: 'Pyramidal Periodization',
    description: 'Visual pyramid structure: broad volume base, tapering to intensity peak. Traditional approach.',
    bestFor: ['Intermediate lifters', 'Traditional programs', 'General preparation'],
    requiredFields: ['weeksPlanned', 'sessionsPerWeek', 'focusAreas', 'buildToDeloadRatio'],
    constraints: {
      minWeeks: 8,
      maxWeeks: 16,
      minSessions: 3,
      maxSessions: 6,
      allowedRatios: ['3:1', '4:1']
    }
  }
};

/**
 * Validate that a plan conforms to the requirements of its selected model
 */
export function validatePlanForModel(plan: Partial<EnhancedPlan>, model: PeriodizationModel): ValidationResult {
  const modelDef = MODELS[model];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields exist
  for (const field of modelDef.requiredFields) {
    if (!(field in plan) || (plan as any)[field] === undefined) {
      errors.push(`Required field "${field}" is missing for ${modelDef.name}`);
    }
  }

  // Check constraints
  if (plan.weeksPlanned?.value !== undefined) {
    const weeks = plan.weeksPlanned.value;
    if (modelDef.constraints.minWeeks && weeks < modelDef.constraints.minWeeks) {
      errors.push(`Minimum ${modelDef.constraints.minWeeks} weeks required for ${modelDef.name}, got ${weeks}`);
    }
    if (modelDef.constraints.maxWeeks && weeks > modelDef.constraints.maxWeeks) {
      warnings.push(`${modelDef.name} typically uses max ${modelDef.constraints.maxWeeks} weeks, got ${weeks}`);
    }
  }

  if (plan.sessionsPerWeek?.value !== undefined) {
    const sessions = plan.sessionsPerWeek.value;
    if (modelDef.constraints.minSessions && sessions < modelDef.constraints.minSessions) {
      errors.push(
        `Minimum ${modelDef.constraints.minSessions} sessions/week required for ${modelDef.name}, got ${sessions}`
      );
    }
    if (modelDef.constraints.maxSessions && sessions > modelDef.constraints.maxSessions) {
      warnings.push(
        `${modelDef.name} typically uses max ${modelDef.constraints.maxSessions} sessions/week, got ${sessions}`
      );
    }
  }

  // Check build:deload ratio if required
  if (modelDef.constraints.allowedRatios && plan.buildToDeloadRatio?.value) {
    const ratio = plan.buildToDeloadRatio.value;
    if (!modelDef.constraints.allowedRatios.includes(ratio)) {
      errors.push(
        `Invalid build:deload ratio "${ratio}" for ${modelDef.name}. Allowed: ${modelDef.constraints.allowedRatios.join(', ')}`
      );
    }
  }

  // Check phase lengths for block models
  if (modelDef.constraints.requiresPhases && modelDef.phases) {
    if (!plan.phaseLengths?.value || plan.phaseLengths.value.length !== modelDef.phases.length) {
      errors.push(`${modelDef.name} requires ${modelDef.phases.length} phase lengths`);
    } else {
      // Validate each phase length
      plan.phaseLengths.value.forEach((length, idx) => {
        const phaseDef = modelDef.phases![idx];
        if (!phaseDef) return;
        
        if (length < phaseDef.minWeeks) {
          errors.push(`Phase "${phaseDef.name}" requires minimum ${phaseDef.minWeeks} weeks, got ${length}`);
        }
        if (length > phaseDef.maxWeeks) {
          warnings.push(`Phase "${phaseDef.name}" typically max ${phaseDef.maxWeeks} weeks, got ${length}`);
        }
      });

      // Check that phase lengths sum to total weeks
      const totalPhaseWeeks = plan.phaseLengths.value.reduce((a, b) => a + b, 0);
      if (plan.weeksPlanned?.value && totalPhaseWeeks !== plan.weeksPlanned.value) {
        errors.push(`Phase lengths sum to ${totalPhaseWeeks} but total weeks is ${plan.weeksPlanned.value}`);
      }
    }
  }

  // Check intensity distribution for polarized
  if (model === 'polarized' && plan.intensityDistribution?.value) {
    const dist = plan.intensityDistribution.value;
    const total = dist.low + dist.moderate + dist.high;
    if (Math.abs(total - 100) > 1) {
      errors.push(`Intensity distribution must sum to 100%, got ${total}%`);
    }
    // Warn if not truly polarized
    if (dist.moderate > 15) {
      warnings.push(`Polarized training typically has <15% moderate intensity, got ${dist.moderate}%`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Recommend a periodization model based on interview context and athlete profile
 */
export function getModelRecommendation(interview: InterviewContext, profile: Profile): PeriodizationModel {
  // Extract key information from interview slots
  const slots = interview.slots;

  // Helper to find answer for a question pattern
  const findAnswer = (pattern: string): string | null => {
    const slot = slots.find(s => s.question.toLowerCase().includes(pattern.toLowerCase()));
    return slot?.answer.toLowerCase() || null;
  };

  const experience = profile.liftingExperience?.toLowerCase() || findAnswer('experience');
  const fitnessLevel = profile.fitnessLevel?.toLowerCase() || findAnswer('fitness');
  const endurance = profile.endurance?.toLowerCase() || findAnswer('endurance');
  const goals = findAnswer('goal') || findAnswer('want to achieve');
  const availability = findAnswer('available') || findAnswer('sessions');
  const competition = findAnswer('competition') || findAnswer('compete');

  // Decision logic for model recommendation
  // Priority: Competition prep > Specialization > Experience level

  // Competition prep athletes
  if (competition?.includes('yes') || competition?.includes('compete')) {
    if (experience?.includes('advanced') || experience?.includes('competitive')) {
      return 'block'; // Block periodization for advanced competitive athletes
    }
  }

  // Endurance-focused athletes
  if (endurance?.includes('high') || goals?.includes('endurance') || goals?.includes('cardio')) {
    return 'polarized'; // Evidence-based for endurance
  }

  // Powerlifting specific
  if (goals?.includes('powerlifting') || goals?.includes('maximal strength')) {
    if (experience?.includes('advanced')) {
      return 'conjugate'; // Westside method for advanced powerlifters
    }
    return 'classical_linear'; // Linear for intermediate powerlifters
  }

  // Experience-based defaults
  if (experience?.includes('beginner') || experience?.includes('novice') || fitnessLevel?.includes('beginner')) {
    return 'simple_progression'; // Keep it simple for beginners
  }

  if (experience?.includes('intermediate')) {
    // Intermediate lifters benefit from variation
    return 'undulating';
  }

  if (experience?.includes('advanced')) {
    return 'block'; // Advanced athletes can handle block periodization
  }

  // Default fallback: simple progression
  return 'simple_progression';
}

/**
 * Apply default values for a given periodization model
 */
export function applyModelDefaults(
  model: PeriodizationModel,
  profile: Profile,
  interview: InterviewContext
): Partial<EnhancedPlan> {
  const modelDef = MODELS[model];
  const now = Date.now();

  const defaults: Partial<EnhancedPlan> = {
    periodizationModel: {
      value: model,
      ownership: 'system',
      lastModified: now,
      modifiedBy: 'ai',
      highlight: false
    }
  };

  // Apply fixed fields if they exist
  if (modelDef.fixedFields) {
    Object.entries(modelDef.fixedFields).forEach(([key, value]) => {
      (defaults as any)[key] = {
        value,
        ownership: 'system',
        lastModified: now,
        modifiedBy: 'ai',
        highlight: false
      };
    });
  }

  // Set default weeks based on model constraints
  if (!defaults.weeksPlanned) {
    const defaultWeeks = modelDef.constraints.minWeeks
      ? Math.min(modelDef.constraints.minWeeks + 2, modelDef.constraints.maxWeeks || 12)
      : 8;
    defaults.weeksPlanned = {
      value: defaultWeeks,
      ownership: 'system',
      lastModified: now,
      modifiedBy: 'ai',
      highlight: false
    };
  }

  // Set default sessions per week
  if (!defaults.sessionsPerWeek) {
    const defaultSessions = modelDef.constraints.minSessions
      ? Math.max(modelDef.constraints.minSessions, 3)
      : 4;
    defaults.sessionsPerWeek = {
      value: defaultSessions,
      ownership: 'system',
      lastModified: now,
      modifiedBy: 'ai',
      highlight: false
    };
  }

  // Set default build:deload ratio if required
  if (modelDef.constraints.allowedRatios && modelDef.constraints.allowedRatios.length > 0 && !defaults.buildToDeloadRatio) {
    defaults.buildToDeloadRatio = {
      value: modelDef.constraints.allowedRatios[0] as string, // First allowed ratio as default
      ownership: 'system',
      lastModified: now,
      modifiedBy: 'ai',
      highlight: false
    };
  }

  // Set default phase lengths for block models
  if (modelDef.phases && !defaults.phaseLengths) {
    const totalWeeks = defaults.weeksPlanned?.value || 12;
    // Distribute weeks proportionally across phases
    const phaseCount = modelDef.phases.length;
    const avgWeeksPerPhase = Math.floor(totalWeeks / phaseCount);
    const remainder = totalWeeks % phaseCount;

    const phaseLengths = modelDef.phases.map((phase, idx) => {
      let weeks = Math.max(phase.minWeeks, Math.min(phase.maxWeeks, avgWeeksPerPhase));
      // Add remainder to later phases
      if (idx >= phaseCount - remainder) weeks++;
      return weeks;
    });

    defaults.phaseLengths = {
      value: phaseLengths,
      ownership: 'system',
      lastModified: now,
      modifiedBy: 'ai',
      highlight: false
    };
  }

  // Set intensity distribution for polarized
  if (model === 'polarized' && modelDef.intensityDistribution) {
    defaults.intensityDistribution = {
      value: modelDef.intensityDistribution,
      ownership: 'system',
      lastModified: now,
      modifiedBy: 'ai',
      highlight: false
    };
  }

  // Set variation pattern for undulating
  if (model === 'undulating' && !defaults.variationPattern) {
    // Default to daily variation for intermediate lifters
    defaults.variationPattern = {
      value: 'daily',
      ownership: 'system',
      lastModified: now,
      modifiedBy: 'ai',
      highlight: false
    };
  }

  return defaults;
}

/**
 * Get human-readable explanation for why a model was recommended
 */
export function getModelRecommendationReason(model: PeriodizationModel, profile: Profile, interview: InterviewContext): string {
  const modelDef = MODELS[model];
  const reasons: string[] = [];

  reasons.push(`I recommend **${modelDef.name}** for your mesocycle.`);
  reasons.push(`\n**Why this model:**`);
  reasons.push(modelDef.description);
  reasons.push(`\n**Best suited for:** ${modelDef.bestFor.join(', ')}`);

  // Add personalized reasoning based on profile
  const experience = profile.liftingExperience?.toLowerCase();
  if (experience?.includes('beginner') && model === 'simple_progression') {
    reasons.push(
      '\nAs a beginner, simple progression will help you build consistency and master fundamental movement patterns.'
    );
  }

  if (experience?.includes('intermediate') && model === 'undulating') {
    reasons.push(
      '\nAt your intermediate level, undulating periodization provides variety to prevent plateaus and maintain adaptation.'
    );
  }

  if (experience?.includes('advanced') && (model === 'block' || model === 'conjugate')) {
    reasons.push('\nWith your advanced training age, you can benefit from more sophisticated programming approaches.');
  }

  return reasons.join(' ');
}
