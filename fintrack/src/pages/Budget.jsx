import StatCard from '../components/StatCard';
import BudgetBar from '../components/BudgetBar';
import BillRow from '../components/BillRow';
import { budgets, bills } from '../data';

export default function Budget() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2 mb-4">
        <StatCard label="budgeted" value="$2,820" sub="this month" />
        <StatCard label="spent" value="$2,692" sub="this month" />
        <StatCard label="remaining" value="$128" sub="in budget" valueStyle={{ color: '#3B6D11' }} />
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        <span
          className="text-xs font-medium px-2.5 py-[3px] rounded-full"
          style={{ color: '#27500A', background: '#C8EBB4' }}
        >
          5 on track
        </span>
        <span
          className="text-xs font-medium px-2.5 py-[3px] rounded-full"
          style={{ color: '#633806', background: '#F5DEB0' }}
        >
          2 approaching
        </span>
        <span
          className="text-xs font-medium px-2.5 py-[3px] rounded-full"
          style={{ color: '#791F1F', background: '#F7C1C1' }}
        >
          3 over budget
        </span>
      </div>

      {budgets.map((b) => (
        <BudgetBar key={b.cat} b={b} />
      ))}

      <p className="text-[13px] font-medium mt-6 mb-2.5 text-gray-900 dark:text-white">Upcoming bills</p>
      {bills.map((b) => (
        <BillRow key={b.name} b={b} />
      ))}
    </>
  );
}
