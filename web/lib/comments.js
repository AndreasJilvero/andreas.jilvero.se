import { supabase } from '../subabase'

export const fetchComments = (slug) => supabase
  .from('comments')
  .select("created_at, content", { count: "exact" })
  .eq('slug', slug)

export const insertComment = (slug, content) => supabase
  .from('comments')
  .insert([{ slug, content }])
  .select("created_at, content")