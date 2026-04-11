import { NextResponse } from 'next/server';
import { getPool } from '../../../src/lib/database';

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      responseTimeMs?: number;
    };
  };
}

export async function GET() {
  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: {
        status: 'disconnected',
      },
    },
  };

  // Check database connectivity
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();

    const responseTimeMs = Date.now() - startTime;
    healthStatus.services.database = {
      status: 'connected',
      responseTimeMs,
    };
  } catch (error) {
    console.error('Health check: Database connection failed', error);
    healthStatus.status = 'unhealthy';
    healthStatus.services.database = {
      status: 'disconnected',
    };
  }

  const httpStatus = healthStatus.status === 'healthy' ? 200 : 503;

  return NextResponse.json(healthStatus, { status: httpStatus });
}
