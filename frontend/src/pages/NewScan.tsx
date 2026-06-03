import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Globe, 
  Layers, 
  AlertTriangle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { startScan, ApiError } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function NewScan() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🟢 STATE: Hidden fields are kept here with defaults for Backend compatibility
  const [formData, setFormData] = useState({
    targetUrl: '',
    depth: 0 as 0 | 1 | 2,
    maxUrls: 50,          // Default hidden value
    timeout: 10000,       // Default hidden value (10s)
    skipSensitive: false, // Default hidden value
    confirmedOwnership: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.confirmedOwnership) {
      toast({
        title: 'Authorization Required',
        description: 'You must confirm that you own or have permission to scan the target.',
        variant: 'destructive',
      });
      return;
    }

    if (!formData.targetUrl) {
      toast({
        title: 'Target URL Required',
        description: 'Please enter a valid target URL to scan.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      //  Sends full config (including hidden defaults) to Backend
      const response = await startScan(formData);
      
      toast({
        title: 'Scan Started',
        description: 'Your security scan has been initiated.',
      });

      navigate(`/scan/${response.scanId}`);
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to start scan. Please try again.';
      
      toast({
        title: 'Scan Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto space-y-8">
        {/* Page Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">New Security Scan</h1>
          <p className="text-muted-foreground mt-2">
            Enter a target URL to start a vulnerability assessment
          </p>
        </div>

        {/* Scan Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="rounded-lg border border-border bg-card p-6 space-y-6">
            
            {/* 1. Target URL */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-primary" />
                <Label htmlFor="targetUrl" className="font-semibold text-base">Target URL</Label>
              </div>
              <Input
                id="targetUrl"
                type="url"
                placeholder="https://example.com"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                className="font-mono h-12"
                required
              />
              <p className="text-xs text-muted-foreground ml-1">
                Must include http:// or https://
              </p>
            </div>

            {/* 2. Crawl Depth */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="w-4 h-4 text-primary" />
                <Label htmlFor="depth" className="font-semibold text-base">Scan Depth</Label>
              </div>
              <Select
                value={String(formData.depth)}
                onValueChange={(value) => setFormData({ ...formData, depth: Number(value) as 0 | 1 | 2 })}
              >
                <SelectTrigger id="depth" className="h-12">
                  <SelectValue placeholder="Select depth" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Level 0 - Single Page (Quick)</SelectItem>
                  <SelectItem value="1">Level 1 - Standard (Links + Sitemap)</SelectItem>
                  <SelectItem value="2">Level 2 - Deep Crawl (Thorough)</SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* 3. Ownership Confirmation */}
          <div 
            className={cn(
              'rounded-lg border p-6 transition-colors',
              formData.confirmedOwnership 
                ? 'border-status-completed/30 bg-status-completed/5' 
                : 'border-status-failed/30 bg-status-failed/5'
            )}
          >
            <div className="flex items-start gap-4">
              <div 
                className={cn(
                  'rounded-lg p-2 mt-1',
                  formData.confirmedOwnership ? 'bg-status-completed/20' : 'bg-status-failed/20'
                )}
              >
                {formData.confirmedOwnership ? (
                  <CheckCircle2 className="w-5 h-5 text-status-completed" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-status-failed" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold">
                    Authorization Confirmation
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                    Scanning targets without authorization is illegal. You must confirm you have 
                    explicit permission to scan this target.
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    id="ownership"
                    checked={formData.confirmedOwnership}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, confirmedOwnership: checked === true })
                    }
                    className="w-5 h-5"
                  />
                  <Label 
                    htmlFor="ownership" 
                    className="text-sm font-medium cursor-pointer"
                  >
                    I confirm that I am authorized to scan this URL
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            className="w-full h-12 text-lg bg-primary text-primary-foreground hover:bg-primary/90 glow-primary"
            disabled={isSubmitting || !formData.confirmedOwnership}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Starting Scan...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5 mr-2" />
                Start Security Scan
              </>
            )}
          </Button>
        </form>
      </div>
    </AppLayout>
  );
}