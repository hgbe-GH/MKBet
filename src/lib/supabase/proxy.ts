import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { getPublicSupabaseEnv } from "@/config/env";
import { toSupabaseConfigurationError } from "@/lib/supabase/errors";
import type { Database } from "@/types/database";

export async function updateSupabaseAuth(request: NextRequest) {
  let response = NextResponse.next({ request });

  try {
    const env = getPublicSupabaseEnv();
    const supabase = createServerClient<Database>(env.url, env.publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }

          response = NextResponse.next({ request });

          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }

          for (const [key, value] of Object.entries(headers)) {
            response.headers.set(key, value);
          }
        },
      },
    });

    await supabase.auth.getClaims();
  } catch (error) {
    if (!toSupabaseConfigurationError(error)) {
      throw error;
    }
  }

  return response;
}
