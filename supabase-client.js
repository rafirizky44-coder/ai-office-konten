
import { createClient } from
  "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = "https://zkwadclyvaiqhwzqyqil.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_HeKrX6-7WjuK_6ypNK0QoA_cVfkNOvu";

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
