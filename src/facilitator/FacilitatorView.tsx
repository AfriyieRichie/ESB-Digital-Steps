import { useState } from 'react';
import { COMPETENCIES } from '../data/competencies';
import { SUBJECTS } from '../data/subjects';
import { collectExport } from '../data/export';
import { exportHubData, importHubData } from '../data/backup';
import { downloadText } from '../ui/download';
import { Button } from '../ui/Button';
import { deleteLearner, updateLearner } from '../learner/createLearner';
import { LearnerForm } from '../learner/LearnerForm';
import { gradeLabel } from '../learner/placement';
import type { Learner } from '../data/db';
import { useFacilitatorData } from './useFacilitatorData';
import { LearnerReport } from './LearnerReport';
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

type ExportState = 'idle' | 'working' | 'done' | 'blocked';

export function FacilitatorView(): React.JSX.Element {
  const [reloadToken, setReloadToken] = useState(0);
  const data = useFacilitatorData(reloadToken);
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [editing, setEditing] = useState<Learner | null>(null);
  const [reportId, setReportId] = useState<string | null>(null);
  const [transferMsg, setTransferMsg] = useState<string | null>(null);

  const reload = (): void => setReloadToken((t) => t + 1);

  async function handleHubExport(): Promise<void> {
    const bundle = await exportHubData();
    const ok = downloadText(`${bundle.filenameBase}.json`, bundle.json, 'application/json');
    setTransferMsg(ok ? 'Hub data saved — copy it to another device to import.' : 'This device blocked the download.');
  }

  async function handleHubImport(file: File): Promise<void> {
    try {
      const result = await importHubData(await file.text());
      setTransferMsg(
        `Imported: ${result.learnersAdded} new learner(s), ${result.learnersUpdated} updated, ${result.competenciesAdded} new skill(s).`,
      );
      reload();
    } catch (err) {
      setTransferMsg(err instanceof Error ? err.message : 'Could not import that file.');
    }
  }

  async function handleExport(format: 'csv' | 'json'): Promise<void> {
    setExportState('working');
    try {
      const bundle = await collectExport();
      const ok =
        format === 'csv'
          ? downloadText(`${bundle.filenameBase}.csv`, bundle.csv, 'text/csv')
          : downloadText(`${bundle.filenameBase}.json`, bundle.json, 'application/json');
      setExportState(ok ? 'done' : 'blocked');
    } catch {
      setExportState('blocked');
    }
  }

  if (reportId) {
    return (
      <section className="facilitator">
        <LearnerReport learnerId={reportId} onBack={() => setReportId(null)} />
      </section>
    );
  }

  if (editing) {
    return (
      <section className="facilitator">
        <LearnerForm
          heading={`Edit ${editing.name}`}
          submitLabel="Save changes"
          initial={{
            name: editing.name,
            band: editing.band,
            avatar: editing.avatar,
            ...(editing.grade !== undefined ? { grade: editing.grade } : {}),
            ...(editing.age !== undefined ? { age: editing.age } : {}),
            ...(editing.school !== undefined ? { school: editing.school } : {}),
          }}
          onSubmit={async (values) => {
            await updateLearner(editing.id, values);
            setEditing(null);
            reload();
          }}
          onCancel={() => setEditing(null)}
        />
      </section>
    );
  }

  return (
    <section className="facilitator">
      <h1 className="facilitator__title">Facilitator dashboard</h1>
      <p className="facilitator__subtitle">
        Competencies demonstrated by each learner. Data is stored on this device.
      </p>

      <p className="facilitator__hint">Tap a learner&rsquo;s name for their full progress report.</p>

      {data.status === 'ready' && (
        <LearnerManager
          learners={data.data.learners}
          onEdit={setEditing}
          onView={setReportId}
          onDeleted={reload}
        />
      )}

      <div className="facilitator__export">
        <Button variant="ghost" onPointerDown={() => void handleExport('csv')} disabled={exportState === 'working'}>
          ⬇ Export CSV
        </Button>
        <Button variant="ghost" onPointerDown={() => void handleExport('json')} disabled={exportState === 'working'}>
          ⬇ Export JSON
        </Button>
        {exportState === 'done' && (
          <span className="facilitator__export-msg" role="status">
            Saved to your device.
          </span>
        )}
        {exportState === 'blocked' && (
          <span className="facilitator__export-msg facilitator__export-msg--warn" role="status">
            This device blocked the download — try a browser, not the sandboxed app.
          </span>
        )}
      </div>

      <div className="facilitator__transfer">
        <span className="facilitator__transfer-label">Move learners between this hub&rsquo;s devices:</span>
        <Button variant="ghost" onPointerDown={() => void handleHubExport()}>
          ⬇ Export hub data
        </Button>
        <label className="facilitator__import">
          ⬆ Import hub data
          <input
            type="file"
            accept="application/json"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleHubImport(file);
              e.target.value = '';
            }}
          />
        </label>
        {transferMsg && (
          <span className="facilitator__export-msg" role="status">
            {transferMsg}
          </span>
        )}
      </div>

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
                      <button
                        type="button"
                        className="facilitator__learner-link"
                        onPointerDown={() => setReportId(learner.id)}
                      >
                        {learner.name}
                      </button>
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

interface LearnerManagerProps {
  learners: Learner[];
  onEdit: (learner: Learner) => void;
  onView: (learnerId: string) => void;
  onDeleted: () => void;
}

/** Add / edit / remove learners. Inline delete confirmation (no popups). */
function LearnerManager({ learners, onEdit, onView, onDeleted }: LearnerManagerProps): React.JSX.Element {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function confirmDelete(id: string): Promise<void> {
    await deleteLearner(id);
    setPendingDelete(null);
    onDeleted();
  }

  function meta(learner: Learner): string {
    const parts = [`Level ${learner.band}`];
    if (learner.grade !== undefined) parts.push(gradeLabel(learner.grade));
    if (learner.school) parts.push(learner.school);
    return parts.join(' · ');
  }

  return (
    <details className="manager">
      <summary className="manager__summary">Manage learners ({learners.length})</summary>
      <ul className="manager__list">
        {learners.map((learner) => (
          <li key={learner.id} className="manager__row">
            <div className="manager__who">
              <span className="manager__name">{learner.name}</span>
              <span className="manager__meta">{meta(learner)}</span>
            </div>
            {pendingDelete === learner.id ? (
              <div className="manager__confirm" role="group" aria-label={`Delete ${learner.name}?`}>
                <span>Delete {learner.name} and all their data?</span>
                <button
                  type="button"
                  className="manager__btn manager__btn--danger"
                  onPointerDown={() => void confirmDelete(learner.id)}
                >
                  Yes, delete
                </button>
                <button
                  type="button"
                  className="manager__btn"
                  onPointerDown={() => setPendingDelete(null)}
                >
                  Keep
                </button>
              </div>
            ) : (
              <div className="manager__actions">
                <button type="button" className="manager__btn" onPointerDown={() => onView(learner.id)}>
                  View
                </button>
                <button type="button" className="manager__btn" onPointerDown={() => onEdit(learner)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="manager__btn manager__btn--danger"
                  onPointerDown={() => setPendingDelete(learner.id)}
                >
                  Remove
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
