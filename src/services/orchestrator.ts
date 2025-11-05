export type ContextHashes = { plan?: string; schedule?: string; recovery?: string; recent?: string };
export type SessionContext = { scId: string; summary: string; hashes: ContextHashes; promptTemplateVersion: string };

export class Orchestrator {
  async distillSC(): Promise<SessionContext> {
    // Placeholder for LLM-backed SC distillation (BYOK)
    return {
      scId: 'sc_local_dev',
      summary: 'Local development session context',
      hashes: {},
      promptTemplateVersion: 'S1'
    };
  }
}

export const orchestrator = new Orchestrator();
