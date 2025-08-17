import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname, hostname } = request.nextUrl
  
  // Handle *.eth.* subdomain routing
  if (hostname.includes('.eth.')) {
    const ensName = hostname.split('.eth.')[0]
    const url = request.nextUrl.clone()
    url.pathname = `/api/proxy/${ensName}.eth${pathname}`
    return NextResponse.rewrite(url)
  }
  
  // Handle direct ENS routing (e.g., /yourname.eth/path)
  const ensMatch = pathname.match(/^\/([^/]+\.eth)(\/.*)?$/)
  if (ensMatch) {
    const [, ensName, path = '/'] = ensMatch
    const url = request.nextUrl.clone()
    url.pathname = `/api/proxy/${ensName}${path}`
    return NextResponse.rewrite(url)
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}