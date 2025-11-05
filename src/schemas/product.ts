import { z } from 'zod';

export const ProfileSchema = z.object({
  ageYears: z.number().int().positive().optional(),
  gender: z.enum(['Male', 'Female']).nullable().optional(),
  heightCm: z.number().optional(),
  weightKg: z.number().optional(),
  units: z.enum(['metric', 'imperial']).default('metric'),
  endurance: z.string().optional(),
  liftingExperience: z.string().optional()
});

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

export type Profile = z.infer<typeof ProfileSchema>;
export type Plan = z.infer<typeof PlanSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Recovery = z.infer<typeof RecoverySchema>;
