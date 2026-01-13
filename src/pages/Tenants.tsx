import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Plus, 
  Building2, 
  CheckCircle2,
  Clock,
  MoreHorizontal
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Tenants() {
  const { tenants, activeTenantId, addTenant, setActiveTenant } = useApp();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tenant = addTenant(formData);
    setActiveTenant(tenant.id);
    setFormData({ name: '', businessName: '' });
    setIsDialogOpen(false);
    toast({
      title: "Tenant created",
      description: `${formData.businessName} has been created successfully.`,
    });
  };

  return (
    <MainLayout>
      <div className="animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="page-header mb-0">
            <h1 className="page-title">Tenants</h1>
            <p className="page-description">
              Manage your business tenants
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tenant</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Contact Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder="e.g., Smith's Consulting Ltd"
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    Create Tenant
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tenants List */}
        {tenants.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No tenants yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first tenant to get started with the demo.
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Tenant
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tenants.map((tenant) => {
              const isActive = tenant.id === activeTenantId;
              return (
                <div
                  key={tenant.id}
                  className={cn(
                    "bg-card rounded-xl border p-5 transition-all cursor-pointer",
                    isActive 
                      ? "border-primary shadow-md" 
                      : "border-border hover:border-primary/50 hover:shadow-sm"
                  )}
                  onClick={() => setActiveTenant(tenant.id)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        Active
                      </span>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-1">{tenant.businessName}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{tenant.name}</p>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Created {new Date(tenant.createdAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* API Info */}
        <div className="mt-8 p-4 bg-muted rounded-lg">
          <h3 className="font-medium text-foreground mb-2">API Integration</h3>
          <p className="text-sm text-muted-foreground">
            In production, tenants are created via the <code className="bg-background px-1 rounded">POST /tenants</code> endpoint. 
            This demo simulates the tenant creation process locally.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
