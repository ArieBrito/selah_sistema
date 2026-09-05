import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

const RUTA_USUARIO = "/registro-pulseras";

export async function proxy(request: NextRequest) {
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

  const { pathname } = request.nextUrl;
  const enLogin = pathname.startsWith("/login");

  if (!user) {
    return enLogin ? response : NextResponse.redirect(new URL("/login", request.url));
  }

  const { data: perfil } = await supabase.from("perfiles").select("rol").eq("id", user.id).maybeSingle();
  const esAdmin = perfil?.rol === "admin";

  if (enLogin) {
    return NextResponse.redirect(new URL(esAdmin ? "/" : RUTA_USUARIO, request.url));
  }

  // El usuario sin permisos de administrador solo existe dentro del registro de pulseras.
  if (!esAdmin && !pathname.startsWith(RUTA_USUARIO)) {
    return NextResponse.redirect(new URL(RUTA_USUARIO, request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logotipo.png).*)"],
};
