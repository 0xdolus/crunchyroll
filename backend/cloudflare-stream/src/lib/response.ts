export function json(
  data: unknown,
  init: ResponseInit = {}
): Response {
  const headers = new Headers(init.headers);

  headers.set("Content-Type", "application/json; charset=utf-8");

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
  });
}

export function errorResponse(
  status: number,
  message: string
): Response {
  return json(
    {
      error: message,
    },
    {
      status,
    }
  );
}
