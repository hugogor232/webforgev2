import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

// REMPLACEZ CES VALEURS PAR CELLES DE VOTRE PROJET SUPABASE
// Vous les trouverez dans Project Settings > API
const SUPABASE_URL = 'https://tgodamurwoupzaeimnho.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnb2RhbXVyd291cHphZWltbmhvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMzQxNDksImV4cCI6MjA3OTkxMDE0OX0.jmzOz-uB21I5yhCsl6v595wEutzhb3URa80w8sx4fyI'

// Initialisation du client Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)