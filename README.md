# UAuth Next.js REST Client

[![Next.js Support](https://img.shields.io/badge/Next.js-v13+-blue)](https://nextjs.org/)

REST API Client khusus untuk Next.js untuk memproteksi Endpoint API Anda dengan UAuth SSO. Package ini kompatibel dengan **App Router**, **Pages Router**, maupun **Edge Middleware**.

## Instalasi

```bash
npm install uauth-nextjs-rest-client
# atau
yarn add uauth-nextjs-rest-client
# atau
pnpm install uauth-nextjs-rest-client
```

## Konfigurasi Environment (`.env`)

Tambahkan variabel berikut ke dalam file `.env` atau `.env.local` Anda:

```ini
UAUTH_API_BASE_URL="https://auth.application.com"
UAUTH_API_PROVIDER_ID="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
# Optional
UAUTH_API_TIMEOUT=30
```

## Cara Penggunaan

Package ini menyediakan 3 cara untuk memproteksi API Anda.

### 1. Menggunakan Edge Middleware (Global / Multi Route)
Paling direkomendasikan jika Anda ingin memproteksi semua API route di bawah `/api/*` secara otomatis.
Buat atau edit file `middleware.ts` di root project Anda (sejajar dengan `app/` atau `pages/`).

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { uauthMiddleware } from 'uauth-nextjs-rest-client';

export async function middleware(req: NextRequest) {
  // Hanya memproteksi route /api/*
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return await uauthMiddleware(req);
  }
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

### 2. Menggunakan App Router Wrapper (`withUAuth`)
Gunakan jika Anda hanya ingin memproteksi Endpoint tertentu saja di App Router (`app/api/.../route.ts`).

```typescript
// app/api/protected/route.ts
import { NextResponse } from 'next/server';
import { withUAuth } from 'uauth-nextjs-rest-client';

export const GET = withUAuth(async (req) => {
  return NextResponse.json({ message: 'Ini adalah data rahasia dari App Router' });
});

export const POST = withUAuth(async (req) => {
  const data = await req.json();
  return NextResponse.json({ message: 'Data diterima', data });
});
```

### 3. Menggunakan Pages Router Wrapper (`withUAuthPages`)
Gunakan jika proyek Anda menggunakan struktur API lama (`pages/api/...`).

```typescript
// pages/api/protected.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { withUAuthPages } from 'uauth-nextjs-rest-client';

function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'Ini adalah data rahasia dari Pages Router' });
}

export default withUAuthPages(handler);
```

## Keamanan & Ekstraksi Kunci API
Package ini dapat membaca kunci API Anda (API Key) secara otomatis dari:
1. `X-API-Key` di Headers (Direkomendasikan)
2. `Authorization: Bearer <token>` di Headers
3. `?api_key=<token>` di Query Parameters URL

## Lisensi
MIT

