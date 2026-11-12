import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5236';

/**
 * Endpoint Proxy para registrar o token criado no PostgreSQL via backend .NET
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const authHeader = request.headers.get('authorization');

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/tokens`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const payload = await backendResponse.text();
    let data: unknown = payload ? { error: payload } : {};
    try {
      data = payload ? JSON.parse(payload) : {};
    } catch {
      // Preserve a non-JSON error response from the .NET API.
    }
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: any) {
    if (error instanceof TypeError && error.message === 'fetch failed') {
      return NextResponse.json(
        { error: 'Backend de registro indisponível. Inicie a API .NET ou configure BACKEND_API_URL.' },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: error?.message || 'Falha ao registrar token no PostgreSQL.' },
      { status: 500 }
    );
  }
}

