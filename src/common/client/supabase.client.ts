import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '@nestjs/config';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(configService: ConfigService): SupabaseClient {
  if (!supabaseInstance) {
    const supabaseUrl = configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseKey = configService.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
    
    supabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  
  return supabaseInstance;
}