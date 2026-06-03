import { useState, useEffect } from 'react';
import { checkHealth, HealthStatus, ApiError } from '@/services/api';

interface UseHealthCheckResult {
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  health: HealthStatus | null;
  refetch: () => Promise<void>;
}

export function useHealthCheck(interval = 30000): UseHealthCheckResult {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  const fetchHealth = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await checkHealth();
      setHealth(result);
      setIsConnected(true);
    } catch (err) {
      setIsConnected(false);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Unable to connect to scanner backend');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const intervalId = setInterval(fetchHealth, interval);
    return () => clearInterval(intervalId);
  }, [interval]);

  return {
    isConnected,
    isLoading,
    error,
    health,
    refetch: fetchHealth,
  };
}
