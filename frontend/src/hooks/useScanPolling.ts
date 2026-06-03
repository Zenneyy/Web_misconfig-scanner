import { useState, useEffect, useCallback, useRef } from 'react';
import { getScanStatus, ScanResult } from '@/services/api';

interface UseScanPollingOptions {
  scanId: string | null;
  interval?: number;
  enabled?: boolean;
}

interface UseScanPollingResult {
  data: ScanResult | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useScanPolling({
  scanId,
  interval = 2000,
  enabled = true,
}: UseScanPollingOptions): UseScanPollingResult {
  const [data, setData] = useState<ScanResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!scanId) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await getScanStatus(scanId);
      
      if (mountedRef.current) {
        setData(result);
        
        // Stop polling if scan is completed or failed
        if (result.status === 'completed' || result.status === 'failed') {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch scan status'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [scanId]);

  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!scanId || !enabled) {
      return;
    }

    // Initial fetch
    fetchStatus();

    // Set up polling
    intervalRef.current = setInterval(fetchStatus, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scanId, enabled, interval, fetchStatus]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchStatus,
  };
}
