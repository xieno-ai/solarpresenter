import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './types';

/**
 * Create a Supabase client for Server Components, Route Handlers, and Server Actions.
 * Uses @supabase/ssr with async cookie access (required in Next.js 16).
 *
 * Usage:
 *   const supabase = await createClient();
 *   const { data } = await supabase.from('alberta_config').select('*');
 */
export async function createClient() {
  const cookieStore = await cookies(); // MUST be awaited in Next.js 16

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can fail in Server Components (read-only cookies).
            // This is expected and safe to ignore — Server Components
            // cannot write cookies. Route Handlers and Server Actions can.
          }
        },
      },
    }
  );
}
