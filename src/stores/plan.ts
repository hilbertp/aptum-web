import { create } from 'zustand';
import {
  EnhancedPlan,
  InterviewContext,
  PlanChangeEvent,
  Profile,
  PeriodizationModel
} from '@/schemas/product';
import {
  initializePlan,
  updatePlanField,
  lockField,
  unlockField,
  toggleFieldLock,
  changePeriodizationModel,
  clearExpiredHighlights,
  getLockedFields,
  getAthleteOwnedFields,
  getSystemOwnedFields,
  calculatePlanCompleteness,
  undoLastChange
} from '@/services/planEngine';

/**
 * Zustand store for mesocycle plan state management
 * Handles plan creation, field updates, ownership tracking, and highlight management
 */
interface PlanStore {
  // ============================================================================
  // State
  // ============================================================================
  currentPlan: Partial<EnhancedPlan> | null;
  interview: InterviewContext | null;
  profile: Profile | null;
  
  // Highlight management
  highlightTimers: Map<string, NodeJS.Timeout>;
  
  // Loading states
  isInitializing: boolean;
  isRebuilding: boolean;
  isReviewing: boolean;
  
  // ============================================================================
  // Actions: Plan Initialization
  // ============================================================================
  
  /**
   * Initialize a new plan from interview context and profile
   */
  initializePlan: (interview: InterviewContext, profile: Profile) => void;
  
  /**
   * Clear current plan (reset)
   */
  clearPlan: () => void;
  
  /**
   * Set interview context
   */
  setInterview: (interview: InterviewContext) => void;
  
  /**
   * Set profile
   */
  setProfile: (profile: Profile) => void;
  
  // ============================================================================
  // Actions: Field Updates
  // ============================================================================
  
  /**
   * Update a plan field value
   */
  updateField: (field: keyof EnhancedPlan, value: any, source: 'ai' | 'athlete', reason?: string) => void;
  
  /**
   * Update multiple fields at once (batch update)
   */
  updateMultipleFields: (updates: Record<string, any>, source: 'ai' | 'athlete', reason?: string) => void;
  
  // ============================================================================
  // Actions: Field Locking
  // ============================================================================
  
  /**
   * Lock a field to prevent modifications
   */
  lockField: (field: keyof EnhancedPlan) => void;
  
  /**
   * Unlock a locked field
   */
  unlockField: (field: keyof EnhancedPlan) => void;
  
  /**
   * Toggle lock state of a field
   */
  toggleLock: (field: keyof EnhancedPlan) => void;
  
  // ============================================================================
  // Actions: Model Selection
  // ============================================================================
  
  /**
   * Change periodization model
   */
  changeModel: (model: PeriodizationModel) => void;
  
  // ============================================================================
  // Actions: Highlight Management
  // ============================================================================
  
  /**
   * Start highlight timer for a field (15s auto-clear)
   */
  startHighlightTimer: (field: keyof EnhancedPlan) => void;
  
  /**
   * Clear highlight for a field
   */
  clearHighlight: (field: keyof EnhancedPlan) => void;
  
  /**
   * Clear all expired highlights
   */
  clearExpiredHighlights: () => void;
  
  /**
   * Clear all highlight timers
   */
  clearAllHighlightTimers: () => void;
  
  // ============================================================================
  // Actions: History
  // ============================================================================
  
  /**
   * Undo last change
   */
  undo: () => void;
  
  /**
   * Check if undo is available
   */
  canUndo: () => boolean;
  
  // ============================================================================
  // Computed Values
  // ============================================================================
  
  /**
   * Get all locked field names
   */
  getLockedFields: () => string[];
  
  /**
   * Get all athlete-owned field names
   */
  getAthleteOwnedFields: () => string[];
  
  /**
   * Get all system-owned field names
   */
  getSystemOwnedFields: () => string[];
  
  /**
   * Calculate plan completeness (0-100%)
   */
  getCompleteness: () => number;
}

/**
 * Create plan store with initial state
 */
export const usePlanStore = create<PlanStore>((set, get) => ({
  // Initial state
  currentPlan: null,
  interview: null,
  profile: null,
  highlightTimers: new Map(),
  isInitializing: false,
  isRebuilding: false,
  isReviewing: false,
  
  // Plan initialization
  initializePlan: (interview: InterviewContext, profile: Profile) => {
    set({ isInitializing: true });
    try {
      const plan = initializePlan(interview, profile);
      set({
        currentPlan: plan,
        interview,
        profile,
        isInitializing: false
      });
      
      // Start highlight timers for all AI-set fields
      if (plan) {
        Object.keys(plan).forEach((key) => {
          const field = (plan as any)[key];
          if (field && typeof field === 'object' && 'highlight' in field && field.highlight) {
            get().startHighlightTimer(key as keyof EnhancedPlan);
          }
        });
      }
    } catch (error) {
      console.error('Error initializing plan:', error);
      set({ isInitializing: false });
    }
  },
  
  clearPlan: () => {
    get().clearAllHighlightTimers();
    set({
      currentPlan: null,
      interview: null,
      profile: null
    });
  },
  
  setInterview: (interview: InterviewContext) => {
    set({ interview });
  },
  
  setProfile: (profile: Profile) => {
    set({ profile });
  },
  
  // Field updates
  updateField: (field: keyof EnhancedPlan, value: any, source: 'ai' | 'athlete', reason?: string) => {
    const { currentPlan } = get();
    if (!currentPlan) return;
    
    const updated = updatePlanField(currentPlan, field, value, source, reason);
    set({ currentPlan: updated });
    
    // If AI updated, start highlight timer
    if (source === 'ai') {
      get().startHighlightTimer(field);
    }
  },
  
  updateMultipleFields: (updates: Record<string, any>, source: 'ai' | 'athlete', reason?: string) => {
    const { currentPlan } = get();
    if (!currentPlan) return;
    
    let updated = { ...currentPlan };
    Object.entries(updates).forEach(([field, value]) => {
      updated = updatePlanField(updated, field as keyof EnhancedPlan, value, source, reason);
      
      // If AI updated, start highlight timer
      if (source === 'ai') {
        get().startHighlightTimer(field as keyof EnhancedPlan);
      }
    });
    
    set({ currentPlan: updated });
  },
  
  // Field locking
  lockField: (field: keyof EnhancedPlan) => {
    const { currentPlan } = get();
    if (!currentPlan) return;
    
    const updated = lockField(currentPlan, field);
    set({ currentPlan: updated });
  },
  
  unlockField: (field: keyof EnhancedPlan) => {
    const { currentPlan } = get();
    if (!currentPlan) return;
    
    const updated = unlockField(currentPlan, field);
    set({ currentPlan: updated });
  },
  
  toggleLock: (field: keyof EnhancedPlan) => {
    const { currentPlan } = get();
    if (!currentPlan) return;
    
    const updated = toggleFieldLock(currentPlan, field);
    set({ currentPlan: updated });
  },
  
  // Model selection
  changeModel: (model: PeriodizationModel) => {
    const { currentPlan, profile, interview } = get();
    if (!currentPlan || !profile || !interview) return;
    
    const updated = changePeriodizationModel(currentPlan, model, profile, interview);
    set({ currentPlan: updated });
    
    // Clear old timers and start new ones for highlighted fields
    get().clearAllHighlightTimers();
    Object.keys(updated).forEach((key) => {
      const field = (updated as any)[key];
      if (field && typeof field === 'object' && 'highlight' in field && field.highlight) {
        get().startHighlightTimer(key as keyof EnhancedPlan);
      }
    });
  },
  
  // Highlight management
  startHighlightTimer: (field: keyof EnhancedPlan) => {
    const { highlightTimers } = get();
    
    // Clear existing timer if any
    const existingTimer = highlightTimers.get(field as string);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Start new 15s timer
    const timer = setTimeout(() => {
      get().clearHighlight(field);
      const timers = get().highlightTimers;
      timers.delete(field as string);
      set({ highlightTimers: new Map(timers) });
    }, 15000);
    
    highlightTimers.set(field as string, timer);
    set({ highlightTimers: new Map(highlightTimers) });
  },
  
  clearHighlight: (field: keyof EnhancedPlan) => {
    const { currentPlan } = get();
    if (!currentPlan) return;
    
    const fieldValue = (currentPlan as any)[field];
    if (fieldValue && typeof fieldValue === 'object' && 'highlight' in fieldValue) {
      const updated = {
        ...currentPlan,
        [field]: {
          ...fieldValue,
          highlight: false,
          highlightUntil: undefined
        }
      };
      set({ currentPlan: updated });
    }
  },
  
  clearExpiredHighlights: () => {
    const { currentPlan } = get();
    if (!currentPlan) return;
    
    const updated = clearExpiredHighlights(currentPlan);
    set({ currentPlan: updated });
  },
  
  clearAllHighlightTimers: () => {
    const { highlightTimers } = get();
    highlightTimers.forEach((timer) => clearTimeout(timer));
    set({ highlightTimers: new Map() });
  },
  
  // History
  undo: () => {
    const { currentPlan } = get();
    if (!currentPlan) return;
    
    const updated = undoLastChange(currentPlan);
    set({ currentPlan: updated });
  },
  
  canUndo: () => {
    const { currentPlan } = get();
    if (!currentPlan || !currentPlan.changeHistory) return false;
    return currentPlan.changeHistory.length > 0;
  },
  
  // Computed values
  getLockedFields: () => {
    const { currentPlan } = get();
    if (!currentPlan) return [];
    return getLockedFields(currentPlan);
  },
  
  getAthleteOwnedFields: () => {
    const { currentPlan } = get();
    if (!currentPlan) return [];
    return getAthleteOwnedFields(currentPlan);
  },
  
  getSystemOwnedFields: () => {
    const { currentPlan } = get();
    if (!currentPlan) return [];
    return getSystemOwnedFields(currentPlan);
  },
  
  getCompleteness: () => {
    const { currentPlan } = get();
    if (!currentPlan) return 0;
    return calculatePlanCompleteness(currentPlan);
  }
}));
