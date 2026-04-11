import { useState } from 'react';
import { useApp } from '../AppContext';
import StatCard from '../components/StatCard';
import GoalCard from '../components/GoalCard';
import GoalModal from '../components/GoalModal';
import { fmtDollars } from '../utils';

export default function Goals() {
  const { goalsData, editGoal, setEditGoal } = useApp();
  const [addOpen, setAddOpen] = useState(false);

  // Summary stats
  const totalSaved    = goalsData.reduce((s, g) => s + g.saved, 0);
  const totalMonthly  = goalsData.reduce((s, g) => s + g.monthly, 0);

  const modalOpen = addOpen || !!editGoal;
  function closeModal() { setAddOpen(false); setEditGoal(null); }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <StatCard
          label="total saved"
          value={fmtDollars(totalSaved)}
          sub={`across ${goalsData.length} goal${goalsData.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="monthly allocation"
          value={fmtDollars(totalMonthly)}
          sub="toward goals"
        />
      </div>

      {goalsData.map((g) => (
        <GoalCard key={g.id} g={g} />
      ))}

      {goalsData.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8">
          No goals yet — add your first one below.
        </p>
      )}

      <button
        onClick={() => setAddOpen(true)}
        className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
      >
        + Add Goal
      </button>

      <GoalModal open={modalOpen} onClose={closeModal} />
    </>
  );
}
