import { supabase } from '../../../lib/supabaseClient';
import ApplyForm from '../../components/ApplyForm';

export const revalidate = 0;

async function getJob(id) {
  const { data, error } = await supabase.from('jobs').select('*').eq('id', id).single();
  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const job = await getJob(id);
  if (!job) return { title: 'Role not found' };
  return {
    title: `${job.title} at ${job.company}`,
    description: job.description?.slice(0, 150),
  };
}

/**
 * Turns a plain-text job description into readable sections.
 * A line is treated as a heading if it's short and either ends with a colon
 * or is written in all caps (e.g. "REQUIREMENTS", "What you'll do:") —
 * everything else renders as a normal paragraph.
 */
function formatDescription(text) {
  if (!text) return [];
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.map((line) => {
    const looksLikeHeading =
      line.length < 60 && (line.endsWith(':') || (line === line.toUpperCase() && /[A-Z]/.test(line)));
    return { type: looksLikeHeading ? 'heading' : 'para', text: line.replace(/:$/, '') };
  });
}

export default async function JobDetailPage({ params }) {
  const { id } = await params;
  const job = await getJob(id);

  if (!job) {
    return (
      <>
        <SiteHeader />
        <section className="section-pad">
          <div className="wrap" style={{ textAlign: 'center' }}>
            <span className="eyebrow">Not found</span>
            <h2 style={{ marginTop: 14 }}>This role isn't available anymore.</h2>
            <p className="sub">It may have been filled or removed.</p>
            <a href="/jobs" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>← See all live roles</a>
          </div>
        </section>
        <SiteFooter />
      </>
    );
  }

  const sections = formatDescription(job.description);

  return (
    <>
      <SiteHeader />

      <section className="section-pad job-detail-hero">
        <div className="wrap">
          <a href="/jobs" className="job-detail-back">← All live roles</a>

          <span className="eyebrow" style={{ marginTop: 18 }}>Verified role</span>
          <h1 className="job-detail-title">{job.title}</h1>
          <div className="job-detail-company">{job.company}</div>

          <div className="job-card-badges" style={{ marginTop: 20 }}>
            <span className="jc-badge jc-badge-location">📍 {job.location}</span>
            <span className="jc-badge jc-badge-type">{job.job_type || 'Full-time'}</span>
            {job.salary_range && <span className="jc-badge jc-badge-salary">💰 {job.salary_range}</span>}
          </div>
        </div>
      </section>

      <div className="perf"></div>

      <section className="section-pad" style={{ paddingTop: 48 }}>
        <div className="wrap job-detail-grid">
          <div className="job-detail-body">
            <h3 className="job-detail-section-label">About this role</h3>
            <div className="job-detail-description">
              {sections.map((s, i) =>
                s.type === 'heading' ? (
                  <h4 key={i} className="job-detail-heading">{s.text}</h4>
                ) : (
                  <p key={i}>{s.text}</p>
                )
              )}
            </div>

            {job.apply_url && (
              <div className="job-detail-external">
                <p>Prefer to apply directly with the employer?</p>
                <a href={job.apply_url} target="_blank" rel="noreferrer" className="btn btn-ghost">Apply externally →</a>
              </div>
            )}
          </div>

          <div className="job-detail-apply-panel">
            <h3 className="job-detail-section-label" style={{ color: '#F7F3E9' }}>Apply for this role</h3>
            <p style={{ color: 'rgba(247,243,233,.7)', fontSize: 13.5, marginBottom: 4 }}>
              Your CV goes straight to our screening team — no account needed.
            </p>
            <ApplyForm job={job} />
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function SiteHeader() {
  return (
    <header className="site">
      <nav className="site">
        <a href="/#top" className="logo"><span className="mark">K</span> Kazi</a>
        <div className="nav-links">
          <a href="/jobs">Live roles</a>
          <a href="/#how">How it works</a>
          <a href="/#trust">Trust &amp; safety</a>
          <a href="/#employers">For employers</a>
        </div>
        <a href="/admin" className="btn btn-ghost">Employer login</a>
      </nav>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
          <span className="mono">© 2026 Kazi. All jobs verified, or flagged trying.</span>
          <a href="/jobs" style={{ fontSize: 13.5, fontWeight: 600 }}>← Back to live roles</a>
        </div>
      </div>
    </footer>
  );
}
