export interface ApiStats {
  totalCalls: number;
  errorCalls: number;
  sumResponseTime: number;
  remainingLimit: number;
  rateLimitedUntil: number;
}

export const apiStats: Record<string, ApiStats> = {
  tradier: { totalCalls: 0, errorCalls: 0, sumResponseTime: 0, remainingLimit: 120, rateLimitedUntil: 0 },
  polygon: { totalCalls: 0, errorCalls: 0, sumResponseTime: 0, remainingLimit: 5, rateLimitedUntil: 0 },
};

export type TelemetryCallback = (provider: string, endpoint: string, status: string, responseTime: number, errorMessage?: string | null) => void;

let telemetryCallback: TelemetryCallback | null = null;

export function registerTelemetryCallback(cb: TelemetryCallback) {
  telemetryCallback = cb;
}

export function recordApiTelemetry(provider: string, endpoint: string, status: string, responseTime: number, errorMessage?: string | null) {
  const prov = provider.toLowerCase();
  const stats = apiStats[prov];
  if (stats) {
    stats.totalCalls++;
    if (status !== 'SUCCESS') {
      stats.errorCalls++;
    }
    stats.sumResponseTime += responseTime;
    
    // Check if error is due to rate limit
    if (errorMessage?.includes('429') || errorMessage?.toLowerCase().includes('rate limit')) {
      stats.rateLimitedUntil = Date.now() + 60000; // 1 min ban
      stats.remainingLimit = 0;
    } else if (stats.remainingLimit > 0) {
      stats.remainingLimit--;
    }
  }

  if (telemetryCallback) {
    telemetryCallback(provider, endpoint, status, responseTime, errorMessage);
  }
}
