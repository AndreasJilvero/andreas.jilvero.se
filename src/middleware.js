export function onRequest({ request, redirect }, next) {
  const url = new URL(request.url);
  if (url.pathname !== '/' && !url.pathname.endsWith('/') && !url.pathname.includes('.')) {
    return redirect(url.pathname + '/', 301);
  }
  return next();
}
