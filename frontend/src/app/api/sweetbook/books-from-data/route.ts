import { NextRequest, NextResponse } from 'next/server';

// Long-running endpoint: creates book (20+ API calls) then places order.
// Must be a Route Handler, not a rewrite — the rewrite proxy resets the socket
// before the backend finishes all the sequential Sweetbook API calls.
export async function POST(request: NextRequest) {
  let body: string;
  try {
    body = await request.text();
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to read request body', message: (err as Error).message },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      'http://localhost:3001/api/sweetbook/books-from-data',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (err) {
    return NextResponse.json(
      { error: 'Order processing failed', message: (err as Error).message },
      { status: 500 },
    );
  }
}
