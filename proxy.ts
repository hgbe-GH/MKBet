import type { NextRequest } from "next/server";

import { updateSupabaseAuth } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSupabaseAuth(request);
}

export const config = {
  matcher: [
    "/((?!api/health|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico)$).*)",
  ],
};
