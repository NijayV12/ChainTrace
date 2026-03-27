import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from "chart.js";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

export interface TrustScorePoint {
  createdAt: string;
  trustScore: number | null;
}

export function TrustScoreChart({ points }: { points: TrustScorePoint[] }) {
  const scored = points.filter((p) => p.trustScore != null);
  if (scored.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500">
          Trust score history
        </p>
        <p className="mt-3 text-xs text-slate-500">
          No scored accounts yet. Submit a verification to see the chart.
        </p>
      </div>
    );
  }

  const data = {
    labels: scored
      .slice()
      .reverse()
      .map((p) => new Date(p.createdAt).toLocaleDateString()),
    datasets: [
      {
        label: "Trust score",
        data: scored
          .slice()
          .reverse()
          .map((p) => p.trustScore as number),
        borderColor: "#14b8a6",
        backgroundColor: "rgba(20,184,166,0.15)",
        tension: 0.3,
        fill: true,
      },
    ],
  };

  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-900/80 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">
        Trust score history
      </p>
      <div className="mt-3">
        <Line
          data={data}
          options={{
            plugins: {
              legend: { display: false },
              tooltip: { intersect: false },
            },
            scales: {
              y: { min: 0, max: 100, ticks: { stepSize: 20 } },
            },
            responsive: true,
            maintainAspectRatio: false,
          }}
        />
      </div>
    </div>
  );
}

