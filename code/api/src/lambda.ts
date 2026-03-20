import app from './index'

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event))
  
  const method = event.requestContext.http.method
  const path = event.rawPath ?? '/'
  const query = event.rawQueryString ? `?${event.rawQueryString}` : ''
  const url = `http://localhost${path}${query}`

  console.log('URL:', url, 'Method:', method)

  const headers = new Headers(event.headers ?? {})

  const request = new Request(url, {
    method,
    headers,
    body: ['GET', 'HEAD'].includes(method) ? undefined : (event.body ?? undefined),
  })

  const response = await app.fetch(request)
  const body = await response.text()

  console.log('Response status:', response.status)
  console.log('Response body:', body)

  return {
    statusCode: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body,
  }
}