import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey } from './utils/extractKey';
import { verifyApiKey } from './core/verify';

export async function uauthMiddleware(req: NextRequest) {
  const apiKey = extractApiKey(req.headers, req.url);

  if (!apiKey) {
    return NextResponse.json(
      { message: 'API key is required for authentication.' },
      { status: 401 }
    );
  }

  const providerId = process.env.UAUTH_API_PROVIDER_ID;
  if (!providerId) {
    console.error('UAUTH_API_PROVIDER_ID is not configured.');
    return NextResponse.json(
      { message: 'Internal Server Error: Missing configuration.' },
      { status: 500 }
    );
  }

  const requestIP = req.ip || req.headers.get('x-forwarded-for') || null;
  const requestMethod = req.method;
  const requestFullUrl = req.url;
  const requestUserAgent = req.headers.get('user-agent') || null;

  // In Edge Middleware, reading the body consumes the stream, which can break the destination route.
  // Unless explicitly handled or necessary, we skip payload verification in Edge Middleware to avoid this.
  const requestPayload = null; 

  const urlObj = new URL(req.url);
  const routeUri = urlObj.pathname;
  const requestSignature = `${requestMethod}:/${routeUri.replace(/^\//, '')}`;

  const { valid, data, status } = await verifyApiKey(apiKey, {
    provider_id: providerId,
    request_ip: requestIP,
    permission: requestSignature,
    method: requestMethod,
    full_url: requestFullUrl,
    payload: requestPayload,
    user_agent: requestUserAgent,
  });

  if (valid) {
    // Continue to the intended route
    return NextResponse.next();
  }

  return NextResponse.json(data, { status });
}

