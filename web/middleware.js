import { NextResponse, NextRequest } from 'next/server'

export async function middleware(req, ev) {
  const reqUrl = new URL(req.url)

  if (reqUrl.pathname == "/blog/") {
    return NextResponse.redirect(reqUrl.protocol + "//" + reqUrl.host + "/")
  }

  return NextResponse.next()
}