import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'Test endpoint not available in production' },
      { status: 404 }
    );
  }

  try {
    const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    console.log('🔍 Sentry Test API Route');
    console.log('DSN Present:', !!sentryDsn);
    console.log('DSN Preview:', sentryDsn ? `${sentryDsn.substring(0, 30)}...` : 'NOT SET');
    
    // Capture test exception
    const testError = new Error('TEST: Sentry API Route Error - This is intentional for testing');
    testError.name = 'SentryTestError';
    
    console.log('📤 Sending test error to Sentry...');
    Sentry.captureException(testError, {
      tags: {
        test: 'api-route',
        timestamp: new Date().toISOString()
      },
      extra: {
        endpoint: '/api/test-sentry',
        method: 'GET',
        message: 'This error was triggered intentionally to test Sentry integration'
      }
    });
    
    console.log('✅ Test error sent to Sentry');
    
    return NextResponse.json({
      success: true,
      message: 'Test error sent to Sentry',
      sentryEnabled: !!sentryDsn,
      dsnPreview: sentryDsn ? `${sentryDsn.substring(0, 30)}...` : null,
      timestamp: new Date().toISOString(),
      instructions: 'Check your Sentry dashboard at https://sentry.io for the error'
    });
    
  } catch (error) {
    console.error('❌ Error in test route:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
