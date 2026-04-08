import StatCard from '../components/StatCard';
import GoalCard from '../components/GoalCard';
import { goals } from '../data';

export default function Goals() {
  return (
    <>
      <div className="grid grid-cols-2 gap-2 mb-5">
        <StatCard label="total saved" value="$23,990" sub="across 4 goals" />
        <StatCard label="monthly allocation" value="$1,250" sub="24% of income" />
      </div>

      {goals.map((g) => (
        <GoalCard key={g.name} g={g} />
      ))}
    </>
  );
}
