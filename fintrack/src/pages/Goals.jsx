import { useState } from 'react';
import { useApp } from '../AppContext';
import StatCard from '../components/StatCard';
import GoalCard from '../components/GoalCard';
import GoalModal from '../components/GoalModal';
import GoalContributionModal from '../components/GoalContributionModal';
import { fmtDollars } from '../utils';

export default function Goals() {
  const {
    goalsData,
    goalContributions,
    addGoalContribution,
    deleteGoalContribution,
    editGoal,
    setEditGoal,
  } = useApp();
  const [addOpen, setAddOpen] = useState(false);
  const [contributionOpen, setContributionOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  // Summary stats
  const totalSaved   = goalsData.reduce((s, g) => s + g.saved, 0);
  const totalTarget  = goalsData.reduce((s, g) => s + g.target, 0);

  const modalOpen = addOpen || !!editGoal;
  function closeModal() { setAddOpen(false); setEditGoal(null); }

  const contributionsByGoal = goalContributions.reduce((map, contribution) => {
    map[contribution.goalId] = map[contribution.goalId] || [];
    map[contribution.goalId].push(contribution);
    return map;
  }, {});

  return (
    <>
      <div className="mb-5 rounded-2xl p-4 text-sm" style={{ background: '#111827', border: '0.5px solid #1f2937', color: '#9ca3af' }}>
        <span className="font-semibold" style={{ color: '#f9fafb' }}>Total saved: {fmtDollars(totalSaved)}</span>
        <span className="mx-2">·</span>
        <span>{`across ${goalsData.length} goal${goalsData.length !== 1 ? 's' : ''}`}</span>
        <span className="mx-2">·</span>
        <span>Total target: {fmtDollars(totalTarget)}</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-5">
        <StatCard
          label="total saved"
          value={fmtDollars(totalSaved)}
          sub={`across ${goalsData.length} goal${goalsData.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          label="total target"
          value={fmtDollars(totalTarget)}
          sub="goal lineup"
        />
      </div>

      {goalsData.map((g) => (
        <GoalCard
          key={g.id}
          g={g}
          contributions={contributionsByGoal[g.id] ?? []}
          onContribute={() => { setSelectedGoal(g); setContributionOpen(true); }}
          onDeleteContribution={(id, amount) => deleteGoalContribution(id, g.id, amount)}
        />
      ))}

      {goalsData.length === 0 && (
        <div className="text-center py-10">
          <div
            className="w-12 h-12 flex items-center justify-center text-white font-semibold text-xl mx-auto mb-4"
            style={{ background: '#27AE60', borderRadius: '10px 3px 10px 3px', fontFamily: 'Geist, system-ui, sans-serif' }}
          >
            N
          </div>
          <p className="text-[15px] font-semibold text-gray-900 dark:text-white mb-1.5">Create your first savings goal</p>
          <p className="text-sm text-gray-400 leading-relaxed mb-0 max-w-[240px] mx-auto">
            Track progress toward vacations, emergency funds, or big purchases.
          </p>
        </div>
      )}

      <button
        onClick={() => setAddOpen(true)}
        className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-[#1f2937] text-sm text-[#6b7280] hover:text-[#9ca3af] hover:border-[#27AE60] transition-colors"
      >
        + Add Goal
      </button>

      <GoalModal open={modalOpen} onClose={closeModal} />
      <GoalContributionModal
        open={contributionOpen}
        goal={selectedGoal}
        onClose={() => setContributionOpen(false)}
        onSave={async ({ amount, note, date }) => {
          if (!selectedGoal) return;
          await addGoalContribution(selectedGoal.id, amount, note, date);
          setContributionOpen(false);
        }}
      />
    </>
  );
}
