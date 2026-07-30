export default function JobCard({ job }) {
  return (
    <a href={`/jobs/${job.id}`} className="job-card job-card-link">
      <div className="job-card-main">
        <h4>{job.title}</h4>
        <div className="co">{job.company}</div>
        <div className="job-card-badges">
          <span className="jc-badge jc-badge-location">{job.location}</span>
          <span className="jc-badge jc-badge-type">{job.job_type || 'Full-time'}</span>
          {job.salary_range && <span className="jc-badge jc-badge-salary">{job.salary_range}</span>}
        </div>
      </div>
      <span className="btn btn-primary job-card-apply">View &amp; Apply →</span>
    </a>
  );
}
