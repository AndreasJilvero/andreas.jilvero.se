import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co"
const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || "placeholder"

const supabase = createClient(supabaseUrl, supabaseKey)

export { supabase }
