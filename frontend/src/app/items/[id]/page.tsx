import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PriceChart } from '@/components/price-chart';

interface PriceHistoryPoint {
  price: number;
  timestamp: number;
}

export default function ItemDetailPage() {
  const params = useParams();
  const { id } = params;
  const [history, setHistory] = useState<PriceHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemName, setItemName] = useState<string>('');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/items/${id}/history`);
        if (!res.ok) throw new Error('Failed to fetch price history');
        const data = await res.json();
        setHistory(data);
      } catch (err) {
        setError('Failed to fetch price history');
      } finally {
        setLoading(false);
      }
    };
    const fetchItemName = async () => {
      try {
        const res = await fetch(`/api/items/search?q=${id}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.length > 0) setItemName(data[0].name);
        }
      } catch {}
    };
    fetchHistory();
    fetchItemName();
  }, [id]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold mb-6 text-center">{itemName ? itemName : 'Item'} Price History</h1>
      <div className="h-[400px] bg-white rounded-xl shadow-lg p-4">
        {loading && <div className="text-center text-blue-500">Loading...</div>}
        {error && <div className="text-center text-red-500">{error}</div>}
        {!loading && !error && history.length > 0 && (
          <PriceChart
            refinedData={history.map(h => ({ timestamp: h.timestamp, value: h.price }))}
            keyData={[]}
            selectedItem="refined"
          />
        )}
        {!loading && !error && history.length === 0 && (
          <div className="text-center text-gray-500">No price history available.</div>
        )}
      </div>
    </div>
  );
} 