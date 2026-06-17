/**
 * Theta Data Local Terminal REST Client
 * Interacts with Theta Terminal running on http://127.0.0.1:25510
 */

export interface ThetaQuoteSnapshot {
  strike: number;
  type: 'C' | 'P';
  bid: number;
  ask: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta?: number;
  gamma?: number;
}

export class ThetaClient {
  private baseUrl: string;

  constructor(port = 25510) {
    this.baseUrl = `http://127.0.0.1:${port}`;
  }

  /**
   * Helper to execute GET requests to Theta Terminal
   */
  private async get(endpoint: string, params: Record<string, string | number>): Promise<any> {
    const query = Object.entries(params)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join('&');
    const url = `${this.baseUrl}${endpoint}?${query}`;

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Theta Terminal Error: HTTP ${res.status} for ${endpoint}`);
    }
    return res.json();
  }

  /**
   * Converts a HH:MM string (e.g. "09:30") to seconds since midnight EST
   */
  public timeToSeconds(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 3600 + minutes * 60;
  }

  /**
   * Converts seconds since midnight to HH:MM string
   */
  public secondsToTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  /**
   * Fetches the 0DTE options chain snapshot for an index/stock on a specific date and time
   * @param root Ticker root symbol (e.g., "SPX", "QQQ")
   * @param date Date format YYYYMMDD (e.g., "20260616")
   * @param timeStr Time format HH:MM (e.g., "09:35")
   */
  public async fetchHistorical0DteChain(
    root: string,
    date: string,
    timeStr: string
  ): Promise<ThetaQuoteSnapshot[]> {
    const seconds = this.timeToSeconds(timeStr);
    
    try {
      // Theta Data REST bulk snapshot endpoint
      // exp=date because it's a 0DTE contract (expires on the same day)
      const data = await this.get('/v2/bulk_snapshot/option/quote', {
        root: root === 'SPX' ? '$SPX' : (root === 'NDX' ? '$NDX' : root),
        exp: date, // Expiration matches snapshot date for 0DTE
        date: date,
        sec: seconds
      });

      if (!data || !data.response || !Array.isArray(data.response)) {
        return [];
      }

      // Format response headers to row elements
      // Typically returns [strike, type_id, bid, ask, volume, open_interest, iv]
      // where type_id 0 = Call, 1 = Put (or similar based on Theta Data specs)
      return data.response.map((row: any) => {
        const type = row.type === 0 || row.type === 'CALL' || row.is_call ? 'C' : 'P';
        return {
          strike: row.strike || 0,
          type,
          bid: row.bid || 0,
          ask: row.ask || 0,
          volume: row.volume || 0,
          openInterest: row.open_interest || row.oi || 0,
          impliedVolatility: row.iv || 0.15
        };
      }).filter((c: any) => c.strike > 0);
    } catch (err) {
      console.warn(`[ThetaClient Warning] Failed to query snapshot for ${root} on ${date} ${timeStr}:`, err);
      return [];
    }
  }

  /**
   * Fetches historical 1-minute candle bars for the underlying stock
   */
  public async fetchHistoricalUnderlyingCandles(
    ticker: string,
    startDate: string,
    endDate: string
  ): Promise<any[]> {
    try {
      const data = await this.get('/v2/historical/stock/candle', {
        req: ticker === 'SPX' ? '$SPX' : (ticker === 'NDX' ? '$NDX' : ticker),
        start_date: startDate,
        end_date: endDate,
        ivl: 60000 // 1-minute interval (60,000 ms)
      });

      if (!data || !data.response) return [];
      return data.response;
    } catch (err) {
      console.error(`[ThetaClient] Failed to fetch historical candles for ${ticker}:`, err);
      return [];
    }
  }
}
