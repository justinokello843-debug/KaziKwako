import { supabase } from '../../lib/supabaseClient';
import JobCard from '../components/JobCard';
import JobSearchBar from '../components/JobSearchBar';

export const revalidate = 0;

const PAGE_SIZE = 9;

export const metadata = {
  title: 'Live Roles',
  description: 'Every verified job currently open on Kazi, newest first.',
};

async function getJobsPage(page, q) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase.from('jobs').select('*', { count: 'exact' }).order('created_at', { ascending: false });

  if (q && q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(`title.ilike.${term},company.ilike.${term},role_category.ilike.${term},location.ilike.${term},description.ilike.${term}`);
  }

  const { data, count, error } = await query.range(from, to);

  if (error) {
    console.error('Failed to load jobs page:', error.message);
    return { jobs: [], total: 0 };
  }
  return { jobs: data || [], total: count || 0 };
}

export default async function JobsPage({ searchParams }) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params?.page || '1', 10) || 1);
  const q = params?.q || '';
  const { jobs, total } = await getJobsPage(page, q);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageLink = (p) => `/jobs?${q ? `q=${encodeURIComponent(q)}&` : ''}page=${p}`;

  return (
    <>
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

      <section className="section-pad jobs-section" style={{ paddingTop: 56 }}>
        <div className="wrap">
          <span className="eyebrow">All verified roles</span>
          <h2 style={{ marginTop: 14 }}>Live roles right now</h2>
          <p className="sub">
            {q
              ? `${total} result${total === 1 ? '' : 's'} for "${q}"`
              : total === 0
              ? 'Nothing posted yet — check back soon.'
              : `${total} verified role${total === 1 ? '' : 's'} open right now, newest first.`}
          </p>

          <JobSearchBar initialQuery={q} />
          {q && (
            <a href="/jobs" style={{ display: 'inline-block', marginTop: 12, marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--clay)' }}>
              ← Clear search, show everything
            </a>
          )}

          <div style={{ marginTop: 24 }}>
            {jobs.length === 0 ? (
              <div className="empty-state">
                {q ? `No live roles matched "${q}" — try a broader search term.` : "No jobs posted yet — once one goes live, it'll show up here."}
              </div>
            ) : (
              jobs.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              {page > 1 && (
                <a href={pageLink(page - 1)} className="btn btn-ghost">← Previous</a>
              )}
              <span className="mono pagination-status">Page {page} of {totalPages}</span>
              {page < totalPages && (
                <a href={pageLink(page + 1)} className="btn btn-primary">Next →</a>
              )}
            </div>
          )}
        </div>
      </section>

      <footer className="site">
        <div className="wrap">
          <div className="foot-bottom" style={{ borderTop: 'none', paddingTop: 0 }}>
            <span className="mono">© 2026 Kazi. All jobs verified, or flagged trying.</span>
            <a href="/#top" style={{ fontSize: 13.5, fontWeight: 600 }}>← Back to homepage</a>
          </div>
        </div>
      </footer>
    </>
  );
}
