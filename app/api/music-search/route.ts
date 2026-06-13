import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ results: [] });

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&limit=12&country=fr`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) return NextResponse.json({ results: [] });

  const json = await res.json();
  return NextResponse.json({ results: json.results ?? [] });
}
