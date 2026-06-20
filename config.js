const SUPABASE_URL = "https://kpcmfblvdkpojrwjqorz.supabase.cos";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtwY21mYmx2ZGtwb2pyd2pxb3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NDE1OTQsImV4cCI6MjA5NzUxNzU5NH0.AgjDrNEYGyega75VVx5Mib9V4b2mH0ZkzcJaaunwng4";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);