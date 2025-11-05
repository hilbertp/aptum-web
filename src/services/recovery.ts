export interface RecoveryService {
  computeSystemic(input: { rhrBpm?: number; hrvRmssdMs?: number; score?: number; recentStrain?: number; externalImpulse?: number }): number;
}

export const recoveryService: RecoveryService = {
  computeSystemic({ score }) {
    if (typeof score === 'number') return Math.max(0, Math.min(100, score));
    return 80; // default per PRD
  }
};
