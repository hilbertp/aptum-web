import { useEffect, useState } from 'react';
import { loadGoalsInterview } from '@/services/interview';
import type { GoalsInterviewState, Blocker, BlockerType } from '@/services/interview';
import { get, put } from '@/services/storage';

export default function Mesocycle() {
  const [goalsState, setGoalsState] = useState<GoalsInterviewState | null>(null);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      let state = await loadGoalsInterview();
      
      // If no plan recommendation exists, create a default one for demo
      if (!state.planRecommendation || !state.planRecommendation.focusAreas?.value?.length) {
        const { createDefaultPlanRecommendation, createDefaultPlanField, saveGoalsInterview } = await import('@/services/interview');
        const defaultPlan = createDefaultPlanRecommendation();
        defaultPlan.focusAreas = createDefaultPlanField(['Strength', 'Hypertrophy'], 'athlete-owned');
        defaultPlan.sessionDistribution = createDefaultPlanField({ 'Strength': 2, 'Hypertrophy': 2 }, 'system-owned');
        state = { ...state, planRecommendation: defaultPlan };
        await saveGoalsInterview(state);
      }
      
      setGoalsState(state);
      
      // Ensure a minimal plan exists for RequireOnboarding
      const existingPlan = await get('plan', 'current');
      if (!existingPlan) {
        const minimalPlan = {
          version: '1.0',
          cycle: {
            weeks: state.planRecommendation?.weeksPlanned?.value || 8,
            startISO: new Date().toISOString().split('T')[0]
          }
        };
        await put('plan', 'current', minimalPlan);
      }
      
      // Load blockers
      const savedBlockers = await get<Blocker[]>('plan', 'blockers');
      setBlockers(savedBlockers || []);
    })();
  }, []);

  const plan = goalsState?.planRecommendation;

  // Calendar helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday

    return { daysInMonth, startingDayOfWeek, year, month };
  };

  const formatDate = (year: number, month: number, day: number): string => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getBlockerForDate = (dateISO: string): Blocker | undefined => {
    return blockers.find(b => b.date === dateISO);
  };

  const toggleBlocker = async (dateISO: string, type: BlockerType) => {
    const existing = getBlockerForDate(dateISO);
    
    let newBlockers: Blocker[];
    if (existing && existing.type === type) {
      // Remove blocker
      newBlockers = blockers.filter(b => b.date !== dateISO);
    } else if (existing) {
      // Update type
      newBlockers = blockers.map(b =>
        b.date === dateISO ? { ...b, type, strain: getDefaultStrainForType(type) } : b
      );
    } else {
      // Add new blocker
      newBlockers = [
        ...blockers,
        {
          id: `${dateISO}-${Date.now()}`,
          date: dateISO,
          type,
          strain: getDefaultStrainForType(type),
        },
      ];
    }

    setBlockers(newBlockers);
    await put('plan', 'blockers', newBlockers);
  };

  const getDefaultStrainForType = (type: BlockerType): 0 | 1 | 2 | 3 => {
    switch (type) {
      case 'game-day': return 3;
      case 'team-practice': return 2;
      case 'recovery': return 0;
      case 'off-day': return 0;
      default: return 1;
    }
  };

  const getBlockerLabel = (type: BlockerType): string => {
    switch (type) {
      case 'game-day': return 'Game';
      case 'team-practice': return 'Practi';
      case 'recovery': return 'Recov';
      case 'off-day': return 'Off';
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const renderCalendar = () => {
    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days: (number | null)[] = [];

    // Add empty slots for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    return (
      <div className="mt-4">
        {/* Month navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ‹
          </button>
          <h3 className="font-semibold">{monthName}</h3>
          <button
            onClick={() => navigateMonth('next')}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ›
          </button>
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-xs font-medium text-zinc-500 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square" />;
            }

            const dateISO = formatDate(year, month, day);
            const blocker = getBlockerForDate(dateISO);

            return (
              <div
                key={`day-${day}`}
                className="aspect-square relative"
              >
                <button
                  onClick={() => setSelectedDate(selectedDate === dateISO ? null : dateISO)}
                  className={`w-full h-full flex flex-col items-center justify-start p-1 rounded border transition-colors ${
                    selectedDate === dateISO
                      ? 'border-aptum-blue bg-aptum-blue/10'
                      : 'border-transparent hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <span className="text-sm">{day}</span>
                  {blocker && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-zinc-400 dark:bg-zinc-600 text-white rounded mt-1 leading-none">
                      {getBlockerLabel(blocker.type)}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Blocker selection panel */}
        {selectedDate && (
          <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
            <div className="text-sm font-medium mb-2">
              {new Date(selectedDate).toLocaleDateString('default', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="flex flex-wrap gap-2">
              {(['off-day', 'game-day', 'team-practice', 'recovery'] as BlockerType[]).map(type => {
                const blocker = getBlockerForDate(selectedDate);
                const isActive = blocker?.type === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => toggleBlocker(selectedDate, type)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-aptum-blue text-white'
                        : 'bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 hover:border-aptum-blue'
                    }`}
                  >
                    {getBlockerLabel(type)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!goalsState || !plan) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Mesocycle Progress</h1>
        <div className="card p-4">
          <p>No plan found. Please complete onboarding first.</p>
          <a href="/onboarding/goals" className="btn btn-primary mt-4 inline-block">
            Go to Goals
          </a>
        </div>
      </div>
    );
  }

  const focusAreas = plan.focusAreas?.value || [];
  const sessionDist = plan.sessionDistribution?.value || {};

  return (
    <div className="max-w-2xl mx-auto p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => window.history.back()}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          ‹
        </button>
        <h1 className="text-xl font-bold">Mesocycle Progress</h1>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="10" strokeWidth="2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
          </svg>
        </button>
      </div>

      {/* AI Coach Conversation */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold mb-2">AI Coach Conversation</h2>
        <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
          "Your current mesocycle plan has been updated. We should decrease your weekly sessions from 4 and will focus on building strength for now and then go to more Plyometric work in the next mesocycle."
        </div>
        <input
          type="text"
          placeholder="Type answer here..."
          className="input mb-3"
        />
        <button className="btn btn-primary w-full">Send Reply</button>
      </div>

      {/* Mesocycle Plan */}
      <div className="card p-4 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Mesocycle Plan</h2>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={plan.weeksPlanned?.value || 8}
              className="input w-16 text-center"
              readOnly
            />
            <span className="text-sm text-zinc-500">Weeks</span>
          </div>
        </div>

        {/* Focus Areas */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">Focus Areas</h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">{plan.sessionsPerWeek?.value || 4}</span>
              <span className="text-sm text-zinc-500">Session per Week</span>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mb-2">Select 1 to 3 focus areas for your training:</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {focusAreas.map((area: string) => {
              const count = sessionDist[area] || 0;
              return (
                <div key={area} className="flex flex-col items-center">
                  <div className="px-3 py-1.5 bg-aptum-blue text-white rounded-full text-sm font-medium">
                    {area}
                  </div>
                  {count > 0 && (
                    <div className="mt-1 w-8 h-8 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-full text-sm font-semibold">
                      {count}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Build-to-Deload Ratio */}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">Build-to-Deload Ratio</h3>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={(plan.buildToDeloadRatio?.value || '3:1').split(':')[0]}
              className="input w-16 text-center"
              readOnly
            />
            <span className="text-sm">to 1</span>
          </div>
        </div>
      </div>

      {/* Microcycles */}
      <div className="card p-4 mb-4">
        <h2 className="font-semibold mb-3">Microcycles <span className="text-sm font-normal text-zinc-500">4 Weeks each</span></h2>
        <div className="grid grid-cols-2 gap-2">
          {[
            { name: 'Block 1', subtitle: 'Adaptation', icon: '🔄' },
            { name: 'Block 2', subtitle: 'Strength Foundation', icon: '🏋️' },
            { name: 'Block 3', subtitle: 'Peak Power', icon: '⚡' },
            { name: 'Block 4', subtitle: 'Taper', icon: '↩️' },
          ].map((block, idx) => (
            <button
              key={idx}
              className="p-3 border-2 border-zinc-200 dark:border-zinc-800 rounded-lg hover:border-aptum-blue transition-colors text-left"
            >
              <div className="font-semibold text-sm">{block.name}</div>
              <div className="text-xs text-zinc-500">{block.subtitle}</div>
              <div className="text-xl mt-1">{block.icon}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Define Off-Days */}
      <div className="card p-4">
        <h2 className="font-semibold mb-2">Define Off-Days</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
          Below you can block days that are meant for team practice, game days, recovery or otherwise blocked
        </p>
        {renderCalendar()}
      </div>
    </div>
  );
}
