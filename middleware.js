import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;
  if (
    pathname === "/rayy-store" ||
    pathname.startsWith("/rayy-store/") ||
    pathname === "/tools-zone" ||
    pathname.startsWith("/tools-zone/")
  ) {
    return new NextResponse("Not Found — domain ini khusus Database Rayy.", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" }
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/rayy-store/:path*", "/tools-zone/:path*", "/rayy-store", "/tools-zone"]
};
