export function extractApiKey(headers: Headers, url: string): string | null {
  // Check X-API-Key header
  const xApiKey = headers.get('X-API-Key');
  if (xApiKey) return xApiKey;

  // Check Authorization header
  const authHeader = headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.substring(7);
  }

  // Check query string
  try {
    const parsedUrl = new URL(url);
    const queryKey = parsedUrl.searchParams.get('api_key');
    if (queryKey) return queryKey;
  } catch (error) {
    // URL parsing failed, fallback if needed or ignore
  }

  return null;
}

