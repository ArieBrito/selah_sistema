import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  // Temporal: en local (npm run dev) se omite el login para poder probar la app.
  // NODE_ENV es "production" en el build de Netlify, así que esto nunca aplica ahí.
  if (process.env.NODE_ENV !== "production") {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const enLogin = request.nextUrl.pathname.startsWith("/login");

  if (!user && !enLogin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && enLogin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logotipo.png).*)"],
};
