import { NextRequest, NextResponse } from 'next/server';
import { extractApiKey } from './utils/extractKey';
import { verifyApiKey } from './core/verify';

type AppRouteHandler = (req: NextRequest, context: any) => Promise<NextResponse> | NextResponse;

export function withUAuth(handler: AppRouteHandler): AppRouteHandler {
  return async (req: NextRequest, context: any) => {
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

    const requestIP = req.headers.get('x-forwarded-for') || (req as any).ip || null;
    const requestMethod = req.method;
    const requestFullUrl = req.url;
    const requestUserAgent = req.headers.get('user-agent') || null;

    // Optional: read payload. Since this is a route wrapper, we can clone the request to read the body safely.
    let requestPayload = null;
    if (['POST', 'PUT', 'PATCH'].includes(requestMethod)) {
      try {
        const clonedReq = req.clone();
        const rawBody = await clonedReq.text();
        
        if (rawBody) {
          // Remove keys like the Laravel implementation does
          const parsed = JSON.parse(rawBody);
          delete parsed.api_key;
          requestPayload = JSON.stringify(parsed);
        }
      } catch (err) {
        // Body reading failed or empty, ignore
      }
    }

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
      return handler(req, context);
    }

    return NextResponse.json(data, { status });
  };
}

