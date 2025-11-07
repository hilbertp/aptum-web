import { useEffect, useState } from 'react';
import { getProfile, setProfile } from '@/services/storage';
import InputWithUnit from '@/components/InputWithUnit';
import SelectBox from '@/components/SelectBox';
import UnitToggle from '@/components/UnitToggle';

type AthleteProfile = {
  name?: string;
  units?: 'metric' | 'imperial';
  ageYears?: number;
  gender?: 'Male' | 'Female';
  heightCm?: number;
  weightKg?: number;
  liftingExperience?: string; // novice|intermediate|advanced|expert
  endurance?: string; // novice|intermediate|advanced|expert
};

export default function Profile() {
  const [profile, setP] = useState<AthleteProfile>({ units: 'metric' });
  const [status, setStatus] = useState<string>('');
  const [heightFt, setHeightFt] = useState<number | ''>('');
  const [heightIn, setHeightIn] = useState<number | ''>('');
  const [weightLb, setWeightLb] = useState<number | ''>('');
  const [autoSaved, setAutoSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getProfile<AthleteProfile>();
      setP({ units: 'metric', ...p });
      // Prefill imperial helpers if needed
      const hcm = p?.heightCm;
      const wkg = p?.weightKg;
      if (p?.units === 'imperial') {
        if (hcm) {
          const totalIn = hcm / 2.54;
          const ft = Math.floor(totalIn / 12);
          const inch = Math.round(totalIn - ft * 12);
          setHeightFt(ft);
          setHeightIn(inch);
        }
        if (wkg) setWeightLb(Math.round(wkg / 0.453592));
      }
    })();
  }, []);

  function toNumber(v: any) {
    if (v === '' || v === null || v === undefined) return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }

  const save = async () => {
    // Convert to metric for storage
    const units = profile.units || 'metric';
    let heightCm = toNumber(profile.heightCm);
    let weightKg = toNumber(profile.weightKg);
    if (units === 'imperial') {
      // Convert from ft+in and lb
      const ft = toNumber(heightFt) || 0;
      const inch = toNumber(heightIn) || 0;
      const totalIn = ft * 12 + inch;
      heightCm = totalIn ? Math.round(totalIn * 2.54) : undefined;
      const lb = toNumber(weightLb);
      weightKg = lb !== undefined ? Math.round(lb * 0.453592 * 10) / 10 : undefined;
    }
    const cleaned: AthleteProfile = {
      ...profile,
      heightCm,
      weightKg
    };
    await setProfile(cleaned);
    setStatus('Saved');
    setTimeout(()=>setStatus(''), 1200);
  };

  // Auto-save on change with debounce so users don't have to press Save
  useEffect(() => {
    const t = setTimeout(() => {
      (async () => {
        await save();
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 1000);
      })();
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile.units, profile.ageYears, profile.gender, profile.heightCm, profile.weightKg, profile.liftingExperience, profile.endurance, heightFt, heightIn, weightLb]);

  // Sync helpers when unit toggled
  useEffect(() => {
    if (profile.units === 'imperial') {
      const cm = toNumber(profile.heightCm);
      if (cm !== undefined) {
        const totalIn = cm / 2.54;
        const ft = Math.floor(totalIn / 12);
        const inch = Math.round(totalIn - ft * 12);
        setHeightFt(ft);
        setHeightIn(inch);
      }
      const kg = toNumber(profile.weightKg);
      if (kg !== undefined) setWeightLb(Math.round(kg / 0.453592));
    }
  }, [profile.units]);

  const LIFTING_LEVELS: Record<string, { label: string; desc: string }> = {
    novice: {
      label: 'Novice',
      desc: 'Less than 6 months of lifting experience. Learning form and core lifts; benefits most from simple progressions and basic structure.'
    },
    intermediate: {
      label: 'Intermediate',
      desc: 'About 6 months to 2 years of consistent training. Tracks loads, follows structured plans, and understands RIR or RPE basics.'
    },
    advanced: {
      label: 'Advanced',
      desc: 'Around 2 to 5 years of experience. Uses periodization, tempos, and deloads, and corrects weak points systematically.'
    },
    expert: {
      label: 'Expert',
      desc: 'More than 5 years of lifting experience. Technically refined, self‑programs effectively, and autoregulates training volume and intensity.'
    }
  };

  const ENDURANCE_LEVELS: Record<string, { label: string; desc: string }> = {
    beginner: {
      label: 'Beginner',
      desc: 'You get tired easily during longer workouts or daily activities. Cardio feels tough, and recovery takes a while.'
    },
    developing: {
      label: 'Developing',
      desc: 'You can jog, cycle, or train steadily for 30–45 minutes. You’re starting to feel more comfortable with conditioning but still gas out on intense days.'
    },
    trained: {
      label: 'Trained',
      desc: 'You do endurance or mixed training a few times a week. You can stay active for about an hour without fading and recover well between sessions.'
    },
    athletic: {
      label: 'Athletic',
      desc: 'You can train hard and long. Back-to-back workouts or long games don’t drain you much, and you bounce back quickly.'
    },
    elite: {
      label: 'Elite',
      desc: 'You have exceptional stamina and recovery. You can push at high intensity for long stretches and stay sharp across demanding training weeks.'
    }
  };

  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-bold text-center">Athlete Profile</h1>
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-line bg-white p-5 shadow-sm">
        <div className="grid gap-3">
          <UnitToggle value={profile.units || 'metric'} onChange={(u)=>setP((p)=>({ ...p, units: u }))} />
          <label className="grid gap-1">
            <span className="text-sm text-muted">Age</span>
            <input className="rounded-xl border border-line px-3 py-2" type="number" min={10} max={95} placeholder="30" value={profile.ageYears ?? ''} onChange={(e)=>setP((p)=>({ ...p, ageYears: toNumber(e.target.value) }))} />
          </label>
          <SelectBox label="Sex" value={profile.gender || ''} onChange={(e)=>setP((p)=>({ ...p, gender: (e.target.value || undefined) as any }))}>
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
          </SelectBox>
          {profile.units === 'imperial' ? (
            <div className="grid gap-2">
              <span className="text-sm text-muted">Height</span>
              <div className="grid grid-cols-2 gap-2">
                <InputWithUnit unit="ft" type="number" placeholder="5" value={heightFt} onChange={(e)=>setHeightFt(toNumber(e.target.value) ?? '')} />
                <InputWithUnit unit="in" type="number" placeholder="10" value={heightIn} onChange={(e)=>setHeightIn(toNumber(e.target.value) ?? '')} />
              </div>
              <InputWithUnit label="Weight" unit="lb" type="number" placeholder="165" value={weightLb} onChange={(e)=>setWeightLb(toNumber(e.target.value) ?? '')} />
            </div>
          ) : (
            <>
              <InputWithUnit label="Height" unit="cm" type="number" placeholder="175" value={profile.heightCm ?? ''} onChange={(e)=>setP((p)=>({ ...p, heightCm: toNumber(e.target.value) }))} />
              <InputWithUnit label="Weight" unit="kg" type="number" placeholder="70" value={profile.weightKg ?? ''} onChange={(e)=>setP((p)=>({ ...p, weightKg: toNumber(e.target.value) }))} />
            </>
          )}
          <SelectBox label="Resistance Training Experience" value={profile.liftingExperience || ''} onChange={(e)=>setP((p)=>({ ...p, liftingExperience: (e.target.value || undefined) }))}>
            <option value="">Select your level</option>
            <option value="novice">Novice</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
            <option value="expert">Expert</option>
          </SelectBox>
          {profile.liftingExperience && (
            <p className="text-sm text-muted">{LIFTING_LEVELS[profile.liftingExperience]?.desc}</p>
          )}
          <SelectBox label="Endurance Capacity" value={profile.endurance || ''} onChange={(e)=>setP((p)=>({ ...p, endurance: (e.target.value || undefined) }))}>
            <option value="">Select your level</option>
            <option value="beginner">Beginner</option>
            <option value="developing">Developing</option>
            <option value="trained">Trained</option>
            <option value="athletic">Athletic</option>
            <option value="elite">Elite</option>
          </SelectBox>
          {profile.endurance && (
            <p className="text-sm text-muted">{ENDURANCE_LEVELS[profile.endurance]?.desc}</p>
          )}
          {autoSaved && (
            <div className="text-xs text-aptum-blue">Auto‑saved</div>
          )}
        </div>
      </div>
    </div>
  );
}
