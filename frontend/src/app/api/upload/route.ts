import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_API_URL || 'http://localhost:5000';

/**
 * Next.js API Gateway / Proxy para o Backend .NET 10
 * Encaminha o upload de logo e geração de metadados Metaplex V3 para o endpoint .NET
 * Repassa os cabeçalhos de autenticação JWT Bearer
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const authHeader = request.headers.get('authorization');

    const headers: Record<string, string> = {};
    if (authHeader) {
      headers['authorization'] = authHeader;
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || 'Falha na comunicação com o backend .NET TokenBet.',
      },
      { status: 500 }
    );
  }
}
