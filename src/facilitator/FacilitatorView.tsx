import { COMPETENCIES } from '../data/competencies';
import { SUBJECTS } from '../data/subjects';
import { useFacilitatorData } from './useFacilitatorData';
import './FacilitatorView.css';

// Read-only dashboard: learners (rows) × the competency framework (columns),
// with a tick where a learner has demonstrated a competency and an overall
// completion percentage per learner. This is the funder-facing record.

// Subjects that actually have competencies defined get a column group; this
// keeps the header honest as reading/writing/numeracy content is added.
const SUBJECTS_WITH_COMPETENCIES = SUBJECTS.filter((s) =>
  COMPETENCIES.some((c) => c.subject === s.id),
);

function formatDuration(totalMs: number): string {
  const totalSeconds = Math.round(totalMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function formatAccuracy(accuracy: number, attempts: number): string {
  return attempts === 0 ? '—' : `${Math.round(accuracy * 100)}%`;
}

export function FacilitatorView(): React.JSX.Element {
  const data = useFacilitatorData();

  return (
    <section className="facilitator">
      <h1 className="facilitator__title">Facilitator dashboard</h1>
      <p className="facilitator__subtitle">
        Competencies demonstrated by each learner. Data is stored on this device.
      </p>

      {data.status === 'loading' && <p>Loading…</p>}
      {data.status === 'error' && (
        <p className="facilitator__error" role="alert">
          Could not load data: {data.error.message}
        </p>
      )}

      {data.status === 'ready' && (
        <div className="facilitator__scroll">
          <table className="facilitator__table">
            <thead>
              <tr>
                <th scope="col" className="facilitator__sticky facilitator__corner">
                  Learner
                </th>
                {SUBJECTS_WITH_COMPETENCIES.map((subject) => {
                  const cols = COMPETENCIES.filter((c) => c.subject === subject.id);
                  return (
                    <th key={subject.id} scope="colgroup" colSpan={cols.length} data-tone={subject.tone}>
                      {subject.label}
                    </th>
                  );
                })}
                <th scope="col" className="facilitator__summary-head" rowSpan={2}>
                  Mastery
                </th>
                <th scope="col" className="facilitator__summary-head" rowSpan={2}>
                  Accuracy
                </th>
                <th scope="col" className="facilitator__summary-head" rowSpan={2}>
                  Time
                </th>
              </tr>
              <tr>
                <th scope="col" className="facilitator__sticky facilitator__corner facilitator__corner--sub" />
                {COMPETENCIES.map((competency) => (
                  <th key={competency.id} scope="col" className="facilitator__comp" title={competency.label}>
                    <span className="facilitator__comp-id">{competency.id}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.data.learners.map((learner) => {
                const row = data.data.grid.get(learner.id);
                const summary = data.data.summaries.get(learner.id);
                return (
                  <tr key={learner.id}>
                    <th scope="row" className="facilitator__sticky facilitator__learner">
                      {learner.name}
                      <span className="facilitator__band">L{learner.band}</span>
                    </th>
                    {COMPETENCIES.map((competency) => {
                      const done = row?.demonstrated[competency.id] ?? false;
                      return (
                        <td
                          key={competency.id}
                          className={done ? 'facilitator__cell facilitator__cell--done' : 'facilitator__cell'}
                        >
                          {done ? (
                            <>
                              <span aria-hidden="true">✓</span>
                              <span className="sr-only">
                                {learner.name} demonstrated {competency.label}
                              </span>
                            </>
                          ) : (
                            <span className="sr-only">
                              {learner.name} has not demonstrated {competency.label}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="facilitator__summary">{row?.completionPercent ?? 0}%</td>
                    <td className="facilitator__summary">
                      {formatAccuracy(summary?.accuracy ?? 0, summary?.attempts ?? 0)}
                    </td>
                    <td className="facilitator__summary">{formatDuration(summary?.totalMs ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
