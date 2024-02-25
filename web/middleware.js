import { NextResponse } from 'next/server'

export async function middleware(req, ev) {
  try {
    if (req.nextUrl.pathname == "/blog/") {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  
    return NextResponse.next()
  }
  catch {
    
  }
}