import { z } from 'zod';

// Base schema for type inference (allows undefined during form input)
const ProfileSchemaBase = z.object({
  ageYears: z.number().int().optional(),
  gender: z.enum(['Male', 'Female']).nullable().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  units: z.enum(['metric', 'imperial']).default('metric'),
  endurance: z.string().optional(),
  liftingExperience: z.string().optional(),
  fitnessLevel: z.string().optional(),
  equipmentAccess: z.enum(['full-gym', 'limited-home-weights', 'bodyweight-only']).optional()
});

// Validation schema with strict requirements
export const ProfileSchema = z.object({
  ageYears: z.number({
    required_error: "Age is required",
    invalid_type_error: "Age must be a number"
  })
    .int("Age must be a whole number")
    .min(6, "Age must be at least 6 years")
    .max(120, "Age must be at most 120 years"),
  gender: z.enum(['Male', 'Female']).nullable().optional(),
  heightCm: z.number({
    required_error: "Height is required",
    invalid_type_error: "Height must be a number"
  })
    .min(50, "Height must be at least 50 cm (20 inches)")
    .max(250, "Height must be at most 250 cm (98 inches)"),
  weightKg: z.number({
    required_error: "Weight is required",
    invalid_type_error: "Weight must be a number"
  })
    .min(25, "Weight must be at least 25 kg (55 lbs)")
    .max(250, "Weight must be at most 250 kg (551 lbs)"),
  units: z.enum(['metric', 'imperial']).default('metric'),
  endurance: z.string().optional(),
  liftingExperience: z.string({
    required_error: "Lifting experience is required"
  }).min(1, "Please select your lifting experience"),
  fitnessLevel: z.string({
    required_error: "Fitness level is required"
  }).min(1, "Please select your fitness level"),
  equipmentAccess: z.enum(['full-gym', 'limited-home-weights', 'bodyweight-only'], {
    required_error: "Equipment access is required"
  })
});

// Use the base schema for type inference
export type Profile = z.infer<typeof ProfileSchemaBase>;

export const PlanSchema = z.object({
  version: z.string(),
  hash: z.string().optional(),
  pattern: z.string().optional(),
  cycle: z.object({ weeks: z.number().int().positive(), startISO: z.string() }),
  priorities: z.record(z.number()).optional(),
  targets: z.object({
    strength: z.record(z.number()).optional(),
    sessions: z.record(z.number()).optional()
  }).optional(),
  constraints: z.object({ defaultDailyCapMin: z.number().int().optional() }).optional(),
  profileSnapshot: ProfileSchema.partial().optional(),
  // Optional knowledge sources attached by retrieval engine for transparency
  sources: z
    .array(
      z.object({
        id: z.string(),
        kind: z.enum(['paper', 'note', 'video_note', 'video_claim']).optional(),
        title: z.string().optional(),
        pmid: z.string().optional(),
        videoId: z.string().optional(),
        url: z.string().optional()
      })
    )
    .optional(),
  acceptedAt: z.string().optional()
});

export const SessionSchema = z.object({
  sessionId: z.string(),
  dateISO: z.string(),
  lengthMin: z.number().int(),
  focus: z.string(),
  blocks: z.array(z.any()),
  policy: z.record(z.any()).optional()
});

export const RecoverySchema = z.object({
  systemic: z.object({
    readiness: z.number().min(0).max(100),
    source: z.string().optional(),
    rhrBpm: z.number().optional(),
    hrvRmssdMs: z.number().optional(),
    baseline: z.object({ rhrBpm: z.number().optional(), hrvRmssdMs: z.number().optional() }).optional()
  }),
  perMuscle: z.record(z.number()).optional(),
  inputs: z.any().optional()
});

// Profile type already defined above
export type Plan = z.infer<typeof PlanSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Recovery = z.infer<typeof RecoverySchema>;

// ============================================================================
// Enhanced Mesocycle Planning Types
// ============================================================================

/**
 * Ownership state for plan fields.
 * - 'system': AI can modify, default state for AI-generated values
 * - 'athlete': Athlete has manually edited, AI cannot modify
 * - 'locked': Explicitly locked by athlete, cannot be modified by AI or manual edits
 */
export type FieldOwnership = 'system' | 'athlete' | 'locked';

/**
 * Wrapper type for plan fields that tracks ownership and modification metadata.
 * Used to implement athlete agency and AI transparency.
 */
export const PlanFieldSchema = <T extends z.ZodTypeAny>(valueSchema: T) =>
  z.object({
    value: valueSchema,
    ownership: z.enum(['system', 'athlete', 'locked']).default('system'),
    lastModified: z.number(), // Unix timestamp
    modifiedBy: z.enum(['ai', 'athlete']),
    highlight: z.boolean().default(false),
    highlightUntil: z.number().optional() // Unix timestamp when highlight should clear
  });

/**
 * Periodization models supported by the system.
 * Each model has different structure, constraints, and optimal use cases.
 */
export const PeriodizationModelSchema = z.enum([
  'simple_progression', // Continuous progressive overload, no distinct phases
  'classical_linear', // Volume → Intensity progression over time
  'block', // Accumulation → Intensification → Realization blocks
  'atr', // Accumulate → Transmute → Realize (variant of block)
  'undulating', // Daily or weekly variation in volume/intensity
  'conjugate', // Concurrent max effort + dynamic effort + repetition
  'reverse', // Intensity → Volume (opposite of classical)
  'polarized', // 80% low intensity + 20% high intensity
  'pyramidal' // Volume base → Intensity peak (visual pyramid)
]);

export type PeriodizationModel = z.infer<typeof PeriodizationModelSchema>;

/**
 * Interview slot capturing a question-answer pair.
 * Used to track conversation context and determine which plan fields are affected.
 */
export const InterviewSlotSchema = z.object({
  question: z.string(),
  answer: z.string(),
  timestamp: z.number(), // Unix timestamp
  relatedFields: z.array(z.string()) // Plan field keys this answer affects
});

/**
 * Complete interview context for plan generation.
 */
export const InterviewContextSchema = z.object({
  slots: z.array(InterviewSlotSchema),
  completeness: z.number().min(0).max(100), // Percentage of required questions answered
  triggersInitialPlan: z.boolean().default(false) // Whether enough context exists for initial plan
});

/**
 * History entry for plan changes.
 * Enables undo/redo and audit trail.
 */
export const PlanChangeEventSchema = z.object({
  timestamp: z.number(), // Unix timestamp
  field: z.string(), // Field key that changed
  oldValue: z.any(),
  newValue: z.any(),
  trigger: z.enum(['ai_initial', 'ai_update', 'athlete_edit', 'rebuild', 'review_apply']),
  reason: z.string() // Human-readable explanation
});

/**
 * Enhanced Plan schema with mesocycle-specific fields.
 * Extends the base Plan with field-level ownership tracking and periodization support.
 */
export const EnhancedPlanSchema = PlanSchema.extend({
  // Mesocycle configuration fields (wrapped with ownership tracking)
  weeksPlanned: PlanFieldSchema(z.number().int().min(2).max(52)).optional(),
  sessionsPerWeek: PlanFieldSchema(z.number().int().min(1).max(14)).optional(),
  focusAreas: PlanFieldSchema(z.array(z.string())).optional(),
  sessionAllocations: PlanFieldSchema(z.record(z.number())).optional(),
  buildToDeloadRatio: PlanFieldSchema(z.string()).optional(), // e.g., "3:1", "4:1"
  periodizationModel: PlanFieldSchema(PeriodizationModelSchema).optional(),

  // Model-specific configurations
  phaseLengths: PlanFieldSchema(z.array(z.number().int().positive())).optional(), // For block, ATR
  intensityDistribution: PlanFieldSchema(
    z.object({
      low: z.number().min(0).max(100),
      moderate: z.number().min(0).max(100),
      high: z.number().min(0).max(100)
    })
  ).optional(), // For polarized
  variationPattern: PlanFieldSchema(z.enum(['daily', 'weekly'])).optional(), // For undulating

  // Metadata
  aiRecommendationReason: z.string().optional(), // Why AI recommended this initial plan
  lastReviewDate: z.number().optional(), // Unix timestamp of last strategy review
  reviewFeedback: z.array(z.string()).optional(), // Suggestions from last review

  // Change tracking
  changeHistory: z.array(PlanChangeEventSchema).default([])
});

export type InterviewSlot = z.infer<typeof InterviewSlotSchema>;
export type InterviewContext = z.infer<typeof InterviewContextSchema>;
export type PlanChangeEvent = z.infer<typeof PlanChangeEventSchema>;
export type EnhancedPlan = z.infer<typeof EnhancedPlanSchema>;

/**
 * Type helper for PlanField values
 */
export type PlanField<T> = {
  value: T;
  ownership: FieldOwnership;
  lastModified: number;
  modifiedBy: 'ai' | 'athlete';
  highlight: boolean;
  highlightUntil?: number;
};

/**
 * Strategy review result from AI analysis
 */
export const StrategyReviewSchema = z.object({
  analysis: z.string(), // Overall assessment
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  suggestions: z.array(
    z.object({
      field: z.string(),
      currentValue: z.any(),
      suggestedValue: z.any(),
      reason: z.string()
    })
  ),
  alternativeModels: z.array(PeriodizationModelSchema).optional(),
  warnings: z.array(z.string()).optional()
});

export type StrategyReview = z.infer<typeof StrategyReviewSchema>;
