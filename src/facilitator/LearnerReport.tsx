import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { gradeLabel } from '../learner/placement';
import { useLearnerReport } from './useLearnerReport';
import './LearnerReport.css';

function formatDuration(totalMs: number): string {
  const totalSeconds = Math.round(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

interface LearnerReportProps {
  learnerId: string;
  onBack: () => void;
}

/** A single child's progress report: overall stats + per-subject breakdown. */
export function LearnerReport({ learnerId, onBack }: LearnerReportProps): React.JSX.Element {
  const state = useLearnerReport(learnerId);

  return (
    <section className="report">
      <Button variant="ghost" onPointerDown={onBack}>
        ← Back to dashboard
      </Button>

      {state.status === 'loading' && <p>Loading…</p>}
      {state.status === 'error' && (
        <p className="report__error" role="alert">
          {state.error.message}
        </p>
      )}

      {state.status === 'ready' && (() => {
        const r = state.data;
        const meta = [`Level ${r.learner.band}`];
        if (r.learner.grade !== undefined) meta.push(gradeLabel(r.learner.grade));
        if (r.learner.school) meta.push(r.learner.school);

        return (
          <>
            <header className="report__head">
              <Avatar name={r.learner.name} avatar={r.learner.avatar} size="lg" />
              <div>
                <h1 className="report__name">{r.learner.name}</h1>
                <p className="report__meta">{meta.join(' · ')}</p>
              </div>
            </header>

            <dl className="report__stats">
              <Stat label="Mastery" value={`${r.masteryPercent}%`} sub={`${r.masteredCount}/${r.totalCount}`} />
              <Stat label="Accuracy" value={r.accuracyPercent === null ? '—' : `${r.accuracyPercent}%`} />
              <Stat label="Time" value={formatDuration(r.timeOnTaskSeconds * 1000)} />
              <Stat label="Streak" value={`${r.streakDays}d`} />
              <Stat label="Stars" value={`${r.stars}`} />
              <Stat label="XP" value={`${r.xp}`} />
            </dl>

            {r.badges.length > 0 && (
              <div className="report__badges">
                {r.badges.map((b) => (
                  <span key={b.id} className="report__badge" title={b.description}>
                    <span aria-hidden="true">{b.emoji}</span> {b.label}
                  </span>
                ))}
              </div>
            )}

            {r.subjects.map((subject) => (
              <div key={subject.subjectId} className="report__subject">
                <div className="report__subject-head" data-tone={subject.subjectId}>
                  <h2 className="report__subject-title">{subject.label}</h2>
                  <span className="report__subject-pct">
                    {subject.masteredCount}/{subject.totalCount} · {subject.percent}%
                  </span>
                </div>
                <ul className="report__skills">
                  {subject.competencies.map((c) => (
                    <li key={c.id} className={`report__skill${c.mastered ? ' report__skill--done' : ''}`}>
                      <span className="report__skill-mark" aria-hidden="true">
                        {c.mastered ? '✓' : '○'}
                      </span>
                      <span className="report__skill-label">{c.label}</span>
                      <span className="report__skill-acc">
                        {c.attempts === 0 ? '—' : `${c.accuracyPercent}% · ${c.attempts} tries`}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </>
        );
      })()}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }): React.JSX.Element {
  return (
    <div className="report__stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
      {sub && <span className="report__stat-sub">{sub}</span>}
    </div>
  );
}
