import app from './index'

export const handler = async (event: any) => {
  const method = event.requestContext.http.method
  const path = event.rawPath ?? '/'
  const query = event.rawQueryString ? `?${event.rawQueryString}` : ''
  const url = `http://localhost${path}${query}`

  const headers = new Headers(event.headers ?? {})

  const request = new Request(url, {
    method,
    headers,
    body: ['GET', 'HEAD'].includes(method) ? undefined : (event.body ?? undefined),
  })

  const response = await app.fetch(request)
  const body = await response.text()

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  }
}