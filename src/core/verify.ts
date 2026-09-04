export interface VerifyKeyParams {
  provider_id: string;
  request_ip: string | null;
  permission: string;
  method: string;
  full_url: string;
  payload: string | null;
  user_agent: string | null;
}

export async function verifyApiKey(
  apiKey: string,
  params: VerifyKeyParams
): Promise<{ valid: boolean; data: any; status: number }> {
  const baseUrl = process.env.UAUTH_API_BASE_URL;
  const timeoutMs = parseInt(process.env.UAUTH_API_TIMEOUT || '30', 10) * 1000;

  if (!baseUrl) {
    throw new Error('UAUTH_API_BASE_URL is not set in environment variables.');
  }

  const verifyUrl = new URL(`${baseUrl.replace(/\/$/, '')}/api-key-verify`);

  // We append query parameters like the Laravel version does with `get` request
  Object.keys(params).forEach((key) => {
    const value = params[key as keyof VerifyKeyParams];
    if (value !== null && value !== undefined) {
      verifyUrl.searchParams.append(key, value);
    }
  });

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(verifyUrl.toString(), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      signal: controller.signal as any,
    });

    clearTimeout(timeout);

    const data = await response.json();

    if (response.ok && data?.status === 'key_valid') {
      return { valid: true, data, status: response.status };
    }

    return { valid: false, data, status: response.status };
  } catch (error) {
    return {
      valid: false,
      data: { message: 'Internal Server Error or Timeout while verifying API key.', error: String(error) },
      status: 500,
    };
  }
}

