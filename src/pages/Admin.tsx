import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Save, 
  Key, 
  Server, 
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function Admin() {
  const { credentials, setCredentials } = useApp();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    clientId: '',
    clientSecret: '',
    subscriptionClientId: '',
    subscriptionClientSecret: '',
    productCode: '',
    platform: '',
    businessTypeCode: '',
  });

  useEffect(() => {
    if (credentials) {
      setFormData(credentials);
    }
  }, [credentials]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentials(formData);
    toast({
      title: "Settings saved",
      description: "Your API credentials have been saved successfully.",
    });
  };

  return (
    <MainLayout>
      <div className="max-w-3xl animate-fade-in">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Admin Settings</h1>
          <p className="page-description">
            Configure your Sage Embedded Services API credentials
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OAuth Credentials */}
          <div className="form-section">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Key className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="section-title">OAuth Credentials</h2>
                <p className="section-description">Primary API authentication credentials</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID</Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => handleChange('clientId', e.target.value)}
                  placeholder="Enter client ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={formData.clientSecret}
                  onChange={(e) => handleChange('clientSecret', e.target.value)}
                  placeholder="Enter client secret"
                />
              </div>
            </div>
          </div>

          {/* Subscription Credentials */}
          <div className="form-section">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h2 className="section-title">Subscription Credentials</h2>
                <p className="section-description">Subscription API authentication</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscriptionClientId">Subscription Client ID</Label>
                <Input
                  id="subscriptionClientId"
                  value={formData.subscriptionClientId}
                  onChange={(e) => handleChange('subscriptionClientId', e.target.value)}
                  placeholder="Enter subscription client ID"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subscriptionClientSecret">Subscription Client Secret</Label>
                <Input
                  id="subscriptionClientSecret"
                  type="password"
                  value={formData.subscriptionClientSecret}
                  onChange={(e) => handleChange('subscriptionClientSecret', e.target.value)}
                  placeholder="Enter subscription client secret"
                />
              </div>
            </div>
          </div>

          {/* Additional Settings */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="section-title">Subscription Settings</h2>
                <p className="section-description">Values from the subscriptions endpoint</p>
              </div>
              <a 
                href="https://developer.columbus.sage.com/docs/services/sage-ses-subscriptions-api/operations/Tenants_GetSubscriptionAsync" 
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                View API Docs
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productCode">Product Code</Label>
                <Input
                  id="productCode"
                  value={formData.productCode}
                  onChange={(e) => handleChange('productCode', e.target.value)}
                  placeholder="e.g., SAGE_ONE"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform">Platform</Label>
                <Input
                  id="platform"
                  value={formData.platform}
                  onChange={(e) => handleChange('platform', e.target.value)}
                  placeholder="e.g., UK"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessTypeCode">Business Type Code</Label>
                <Input
                  id="businessTypeCode"
                  value={formData.businessTypeCode}
                  onChange={(e) => handleChange('businessTypeCode', e.target.value)}
                  placeholder="e.g., SOLE_TRADER"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between pt-4">
            {credentials && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Credentials configured</span>
              </div>
            )}
            <Button type="submit" className="ml-auto">
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">About API Credentials</h3>
          <p className="text-sm text-muted-foreground">
            These credentials are stored locally in your browser and used to authenticate 
            with the Sage Embedded Services sandbox API. In a production environment, 
            these would be securely stored on the server.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
