import { NextApiRequest, NextApiResponse } from 'next';
import { extractApiKey } from './utils/extractKey';
import { verifyApiKey } from './core/verify';

type PagesRouteHandler = (req: NextApiRequest, res: NextApiResponse) => void | Promise<void>;

export function withUAuthPages(handler: PagesRouteHandler): PagesRouteHandler {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // In pages router, headers are a plain object, we need to adapt it
    const headersAdaptor = new Headers();
    Object.keys(req.headers).forEach((key) => {
      const value = req.headers[key];
      if (typeof value === 'string') {
        headersAdaptor.set(key, value);
      } else if (Array.isArray(value)) {
        headersAdaptor.set(key, value.join(', '));
      }
    });

    const host = req.headers.host || 'localhost';
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const fullUrl = `${protocol}://${host}${req.url}`;

    const apiKey = extractApiKey(headersAdaptor, fullUrl);

    if (!apiKey) {
      return res.status(401).json({ message: 'API key is required for authentication.' });
    }

    const providerId = process.env.UAUTH_API_PROVIDER_ID;
    if (!providerId) {
      console.error('UAUTH_API_PROVIDER_ID is not configured.');
      return res.status(500).json({ message: 'Internal Server Error: Missing configuration.' });
    }

    const requestIP = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || null;
    const requestMethod = req.method || 'GET';
    const requestUserAgent = req.headers['user-agent'] || null;

    let requestPayload = null;
    if (['POST', 'PUT', 'PATCH'].includes(requestMethod) && req.body) {
      const bodyCopy = typeof req.body === 'string' ? JSON.parse(req.body) : { ...req.body };
      delete bodyCopy.api_key;
      requestPayload = JSON.stringify(bodyCopy);
    }

    const routeUri = req.url ? req.url.split('?')[0] : '/';
    const requestSignature = `${requestMethod}:/${routeUri.replace(/^\//, '')}`;

    const { valid, data, status } = await verifyApiKey(apiKey, {
      provider_id: providerId,
      request_ip: requestIP,
      permission: requestSignature,
      method: requestMethod,
      full_url: fullUrl,
      payload: requestPayload,
      user_agent: requestUserAgent,
    });

    if (valid) {
      return handler(req, res);
    }

    return res.status(status).json(data);
  };
}

