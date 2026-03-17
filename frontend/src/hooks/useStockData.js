import { useState, useEffect, useCallback } from 'react';

export function useStockData(fetchFunction, dependencies = [], interval = null) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchFunction();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Veri yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction]);

  useEffect(() => {
    fetchData();

    if (interval) {
      const timer = setInterval(fetchData, interval);
      return () => clearInterval(timer);
    }
  }, [...dependencies, fetchData, interval]);

  return { data, loading, error, refetch: fetchData };
}

export default useStockData;
