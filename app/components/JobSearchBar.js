'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabaseClient';

export default function JobSearchBar({ initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const term = `%${trimmed}%`;
        const { data, error } = await supabase
          .from('jobs')
          .select('id, title, company, location, role_category, job_type')
          .or(`title.ilike.${term},company.ilike.${term},role_category.ilike.${term},location.ilike.${term}`)
          .order('created_at', { ascending: false })
          .limit(6);

        if (!error) {
          setSuggestions(data || []);
          setOpen(true);
        }
      } catch (err) {
        console.error('Search suggestion fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function goToResults(term) {
    window.location.href = `/jobs?q=${encodeURIComponent(term)}`;
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (query.trim()) goToResults(query.trim());
    }
  }

  return (
    <div className="job-search" ref={boxRef}>
      <div className="job-search-bar">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: 0.5 }}>
          <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
          <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          placeholder="Search by role, company, or location — e.g. &quot;remote designer&quot;"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
        />
        <button type="button" className="btn btn-primary" onClick={() => query.trim() && goToResults(query.trim())}>
          Search
        </button>
      </div>

      {open && (
        <div className="job-search-suggestions">
          {loading && <div className="job-search-hint">Searching…</div>}
          {!loading && suggestions.length === 0 && (
            <div className="job-search-hint">No live roles match "{query}" yet — try a broader term, or check back soon.</div>
          )}
          {!loading && suggestions.map((job) => (
            <button
              type="button"
              key={job.id}
              className="job-search-suggestion"
              onClick={() => goToResults(job.title)}
            >
              <span className="jss-title">{job.title}</span>
              <span className="jss-meta">{job.company} · {job.location}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
