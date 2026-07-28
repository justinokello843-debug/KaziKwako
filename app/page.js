import { supabase } from '../lib/supabaseClient';
import HomeClient from './components/HomeClient';

export const revalidate = 0;

async function getJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) { console.error('Failed to load jobs:', error.message); return []; }
  return data || [];
}

export default async function HomePage() {
  const jobs = await getJobs();
  return <HomeClient jobs={jobs} />;
}
