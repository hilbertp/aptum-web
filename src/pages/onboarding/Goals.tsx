import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell, Heart, Zap, Minus, Plus } from 'lucide-react';

type FocusArea = 'Strength' | 'Hypertrophy' | 'Power / Explosiveness' | 'Endurance (steady)' | 'HIIT / Conditioning' | 'Mobility' | 'Sport Performance' | 'Fat Loss' | 'Longevity / Health' | '';

const FOCUS_AREAS: FocusArea[] = [
  '',
  'Strength',
  'Hypertrophy', 
  'Power / Explosiveness',
  'Endurance (steady)',
  'HIIT / Conditioning',
  'Mobility',
  'Sport Performance',
  'Fat Loss',
  'Longevity / Health'
];

const FOCUS_AREA_ICONS: Record<string, React.ReactNode> = {
  'Strength': <Dumbbell className="w-5 h-5" />,
  'Hypertrophy': <Dumbbell className="w-5 h-5" />,
  'Power / Explosiveness': <Zap className="w-5 h-5" />,
  'Endurance (steady)': <Heart className="w-5 h-5" />,
  'HIIT / Conditioning': <Zap className="w-5 h-5" />,
};

export default function Goals() {
  const nav = useNavigate();
  
  // State
  const [priority1, setPriority1] = useState<FocusArea>('Strength');
  const [priority2, setPriority2] = useState<FocusArea>('Endurance (steady)');
  const [priority3, setPriority3] = useState<FocusArea>('Power / Explosiveness');
  
  const [totalSessions, setTotalSessions] = useState(7);
  const [distribution, setDistribution] = useState<Record<string, number>>({
    'Strength': 3,
    'Endurance (steady)': 2,
    'Power / Explosiveness': 2
  });
  
  const [deloadRatio, setDeloadRatio] = useState(3);
  const [progressionType1, setProgressionType1] = useState('Linear');
  const [progressionType2, setProgressionType2] = useState('Linear Periodization');
  
  // Get active priorities
  const activePriorities = [priority1, priority2, priority3].filter(p => p !== '');
  
  // Calculate total allocated sessions
  const allocatedSessions = activePriorities.reduce((sum, priority) => {
    return sum + (distribution[priority] || 0);
  }, 0);
  
  // Update distribution when priorities change
  useEffect(() => {
    const newDist: Record<string, number> = {};
    activePriorities.forEach((priority, idx) => {
      if (priority) {
        newDist[priority] = distribution[priority] || (idx === 0 ? 3 : 2);
      }
    });
    setDistribution(newDist);
  }, [priority1, priority2, priority3]);
  
  const updateDistribution = (area: string, delta: number) => {
    const current = distribution[area] || 0;
    const newValue = Math.max(0, Math.min(21, current + delta));
    setDistribution({ ...distribution, [area]: newValue });
  };
  
  const updateDeloadRatio = (delta: number) => {
    setDeloadRatio(Math.max(2, Math.min(6, deloadRatio + delta)));
  };
  
  const handleContinue = () => {
    // Save and navigate to next step
    nav('/onboarding/plan');
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <button onClick={() => nav('/onboarding/connect')} className="flex items-center gap-2 text-gray-700">
          <span className="text-lg">←</span>
          <span className="font-medium">Your Training Plan</span>
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <div className="w-5 h-5 bg-gray-800 rounded-full"></div>
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <div className="w-5 h-5 bg-gray-400 rounded-full"></div>
          </button>
        </div>
      </div>
      
      {/* Progress dots */}
      <div className="flex justify-center gap-1 py-6">
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-gray-300"></div>
        <div className="w-2 h-2 rounded-full bg-gray-900"></div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-md mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Define Your Focus</h1>
          <p className="text-gray-600">
            Set your training priorities and allocate sessions for your next block.
          </p>
        </div>
        
        {/* Prioritize Training Focus */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Prioritize Training Focus</h2>
          <p className="text-sm text-gray-600 mb-4">
            Select up to two training types in order of importance.
          </p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">1st Priority</label>
              <select 
                value={priority1} 
                onChange={(e) => setPriority1(e.target.value as FocusArea)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FOCUS_AREAS.map(area => (
                  <option key={area} value={area}>{area || 'Select...'}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">2nd Priority</label>
              <select 
                value={priority2} 
                onChange={(e) => setPriority2(e.target.value as FocusArea)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FOCUS_AREAS.map(area => (
                  <option key={area} value={area}>{area || 'Select...'}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-1">3rd Priority</label>
              <select 
                value={priority3} 
                onChange={(e) => setPriority3(e.target.value as FocusArea)}
                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {FOCUS_AREAS.map(area => (
                  <option key={area} value={area}>{area || 'Select...'}</option>
                ))}
              </select>
            </div>
          </div>
        </section>
        
        {/* Weekly Session Count */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Weekly Session Count</h2>
          <p className="text-sm text-gray-600">
            Recommended for you: {totalSessions} sessions on {Math.min(totalSessions, 5)} days
          </p>
        </section>
        
        {/* Session Allocation */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Session Allocation</h2>
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-700">Total Sessions:</span>
            <span className="text-sm font-semibold text-gray-900">{allocatedSessions}</span>
          </div>
          
          <div className="space-y-3">
            {activePriorities.map((priority) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-gray-700">
                    {FOCUS_AREA_ICONS[priority] || <Dumbbell className="w-5 h-5" />}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{priority}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateDistribution(priority, -1)}
                    className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center font-semibold text-gray-900">
                    {distribution[priority] || 0}
                  </span>
                  <button
                    onClick={() => updateDistribution(priority, 1)}
                    className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
        
        {/* Deload Ratio */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Deload Ratio</h2>
          <p className="text-sm text-gray-600 mb-4">Build weeks to deload weeks ratio.</p>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-900">Ratio</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateDeloadRatio(-1)}
                className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-semibold text-gray-900">
                {deloadRatio}:1
              </span>
              <button
                onClick={() => updateDeloadRatio(1)}
                className="w-9 h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
        
        {/* Progression Type */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-1">Progression Type</h2>
          <p className="text-sm text-gray-600 mb-4">Choose your progression strategy.</p>
          
          <div className="space-y-3">
            <select 
              value={progressionType1}
              onChange={(e) => setProgressionType1(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Linear">Linear</option>
              <option value="Undulating">Undulating</option>
              <option value="Block">Block</option>
            </select>
            
            <select 
              value={progressionType2}
              onChange={(e) => setProgressionType2(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Linear Periodization">Linear Periodization</option>
              <option value="Daily Undulating">Daily Undulating</option>
              <option value="Weekly Undulating">Weekly Undulating</option>
            </select>
          </div>
        </section>
      </div>
      
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-md mx-auto flex gap-3">
          <button
            onClick={() => nav('/onboarding/connect')}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
          <button
            onClick={handleContinue}
            className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
      
      {/* Bottom Tab Bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-200">
        <div className="flex justify-around py-3">
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <span className="text-xs">Dashboard</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-900">
            <div className="w-6 h-6 bg-gray-900 rounded-full"></div>
            <span className="text-xs font-medium">Plan</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <span className="text-xs">Activities</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400">
            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
            <span className="text-xs">Learn</span>
          </button>
        </div>
      </div>
    </div>
  );
}
