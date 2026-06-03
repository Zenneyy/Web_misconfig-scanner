import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { Search } from 'lucide-react';

import { AppLayout } from '@/components/layout/AppLayout';

import { RecentScansTable } from '@/components/scanner/RecentScansTable';

import { Input } from '@/components/ui/input';

import { getRecentScans, ScanListItem } from '@/services/api';

import { useHealthCheck } from '@/hooks/useHealthCheck';
 
export default function ScanHistory() {

  const navigate = useNavigate();

  const { isConnected } = useHealthCheck();
 
  const [scans, setScans] = useState<ScanListItem[]>([]);

  const [filteredScans, setFilteredScans] = useState<ScanListItem[]>([]);

  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
 
  useEffect(() => {

    async function fetchScans() {

      try {

        const data = await getRecentScans();

        // ✅ FIX 1: backend returns { total, scans }

        const scanList = data.scans ?? [];

        setScans(scanList);

        setFilteredScans(scanList);

      } catch (error) {

        console.error('Failed to fetch scan history:', error);

        setScans([]);

        setFilteredScans([]);

      } finally {

        setIsLoading(false);

      }

    }
 
    if (isConnected) {

      fetchScans();

    }

  }, [isConnected]);
 
  useEffect(() => {

    if (!searchQuery) {

      setFilteredScans(scans);

      return;

    }
 
    const query = searchQuery.toLowerCase();
 
    const filtered = scans.filter(scan =>

      scan.targetUrl.toLowerCase().includes(query) ||

      // ✅ FIX 2: use scan.id (NOT scan.scanId)

      scan.id.toLowerCase().includes(query)

    );
 
    setFilteredScans(filtered);

  }, [searchQuery, scans]);
 
  return (
<AppLayout>
<div className="space-y-8">

        {/* Header */}
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
<div>
<h1 className="text-3xl font-bold tracking-tight">Scan History</h1>
<p className="text-muted-foreground mt-1">

              View and manage all your security scans
</p>
</div>
</div>
 
        {/* Search */}
<div className="relative max-w-md">
<Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
<Input

            placeholder="Search by target URL or scan ID..."

            value={searchQuery}

            onChange={e => setSearchQuery(e.target.value)}

            className="pl-10"

          />
</div>
 
        {/* Scan Table */}
<RecentScansTable

          scans={filteredScans}

          isLoading={isLoading}

          // onRowClick={scan => navigate(`/scan/${scan.id}`)}

        />
</div>
</AppLayout>

  );

}

 