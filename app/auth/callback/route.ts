import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const type = searchParams.get("type");
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Password recovery → form to set a new password
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/update-password`);
      }

      const { data: { user } } = await supabase.auth.getUser();

      // Email signup confirmation → dedicated confirmation page
      if (type === "signup") {
        return NextResponse.redirect(`${origin}/auth/confirmed?type=signup`);
      }

      // Magic link or invite → check if wedding exists
      if (user) {
        const { data: ownedWedding } = await supabase
          .from("wedding")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();

        const { data: sharedWedding } = await supabase
          .from("wedding_access")
          .select("id")
          .eq("user_id", user.id)
          .not("accepted_at", "is", null)
          .limit(1)
          .maybeSingle();

        const dest = type === "magiclink"
          ? "/auth/confirmed?type=magiclink"
          : type === "invite"
            ? "/auth/confirmed?type=invite"
            : (ownedWedding || sharedWedding) ? "/dashboard" : "/onboarding";

        return NextResponse.redirect(`${origin}${dest}`);
      }

      return NextResponse.redirect(`${origin}/auth/confirmed?type=signup`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/confirmed?error=invalid`);
}
