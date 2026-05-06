import { NextRequest } from 'next/server';
import { config } from '@/lib/config';

export const dynamic = 'force-dynamic';

async function getAuthToken(): Promise<string> {
  const response = await fetch(`${config.apiUrl}/auth/account/emailpass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: config.username, password: config.password }),
  });
  if (!response.ok) throw new Error(`Authentication failed: ${response.statusText}`);
  const data = await response.json();
  return data.token || data.access_token;
}

export async function GET(request: NextRequest) {
  const offerId = request.nextUrl.searchParams.get('offerId');
  if (!offerId) {
    return new Response('Missing offerId', { status: 400 });
  }

  try {
    const token = await getAuthToken();

    const upstream = await fetch(
      `${config.apiUrl}/v2/${config.issuerTarget}/issuer-service-api/issuance-session/${offerId}/events`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      }
    );

    if (!upstream.ok || !upstream.body) {
      return new Response(`Upstream SSE error: ${upstream.statusText}`, { status: upstream.status });
    }

    const reader = upstream.body.getReader();

    // Forward each chunk as-is so the browser EventSource parses them correctly
    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();
          if (done) {
            controller.close();
            return;
          }
          controller.enqueue(value);
        } catch {
          // Upstream closed the connection (session expired, socket reset, etc.)
          // Close gracefully so the browser doesn't receive a 500
          controller.close();
        }
      },
      cancel() {
        reader.cancel();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
