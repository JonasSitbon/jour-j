import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { pathname } = request.nextUrl;

  const publicPaths = ["/", "/login", "/signup", "/auth", "/reset-password", "/update-password", "/rsvp", "/share", "/invite"];
  const isPublic = publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));

  // Si la route est publique, on laisse passer sans appel Supabase
  // → évite les cold start failures qui crashent le middleware sur la landing page
  if (isPublic && !pathname.startsWith("/admin")) {
    // Pas de cache pour éviter que les redirections passées soient mises en cache navigateur
    supabaseResponse.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
    return supabaseResponse;
  }

  // Pour les routes protégées, on vérifie l'authentification
  let user = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // En cas d'erreur Supabase (cold start, réseau), on redirige vers /login
    // plutôt que de laisser crasher le middleware
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirige les non-authentifiés vers /login
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Protection des routes /admin : super_admin uniquement
  if (pathname.startsWith("/admin")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .maybeSingle();
    if (!profile || profile.account_type !== "super_admin") {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
