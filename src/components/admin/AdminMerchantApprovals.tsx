import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Store, Truck, CheckCircle, XCircle, AlertCircle, Clock, Eye } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface Application {
  id: string;
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'needs_info';
  created_at: string;
  [key: string]: any;
}

interface BusinessAddress {
  street: string;
  city: string;
  state: string;
  zip_code: string;
}

interface MerchantApplication extends Application {
  business_name: string;
  business_type: string;
  business_description: string | null;
  business_license_number: string | null;
  tax_id: string | null;
  business_address: BusinessAddress;
}

interface DriverApplication extends Application {
  vehicle_info: {
    make: string;
    model: string;
    year: string;
    plate: string;
  };
  documents: {
    drivers_license: string | null;
    insurance: string | null;
    vehicle_registration: string | null;
  };
}

const AdminMerchantApprovals = () => {
  const [merchantApplications, setMerchantApplications] = useState<MerchantApplication[]>([]);
  const [driverApplications, setDriverApplications] = useState<DriverApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'needs_info'>('approved');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setError(null);
      setLoading(true);

      // Fetch merchant applications
      const { data: merchantData, error: merchantError } = await supabase
        .from('merchant_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (merchantError) throw merchantError;

      // Transform merchant data
      const formattedMerchantData: MerchantApplication[] = (merchantData || []).map(app => {
        try {
          const address = typeof app.business_address === 'string'
            ? JSON.parse(app.business_address)
            : app.business_address || { street: '', city: '', state: '', zip_code: '' };

          return {
            id: app.id,
            first_name: app.contact_person_first_name || '',
            last_name: app.contact_person_last_name || '',
            email: app.email || '',
            phone: app.phone || '',
            status: (app.status as MerchantApplication['status']) || 'pending',
            created_at: app.created_at || new Date().toISOString(),
            business_name: app.business_name || '',
            business_type: app.business_type || '',
            business_description: app.business_description,
            business_license_number: app.business_license_number,
            tax_id: app.tax_id,
            business_address: {
              street: address.street || '',
              city: address.city || '',
              state: address.state || '',
              zip_code: address.zip_code || ''
            }
          };
        } catch (err) {
          console.error('Error processing merchant application:', err);
          return null;
        }
      }).filter(Boolean) as MerchantApplication[];

      setMerchantApplications(formattedMerchantData);

      // Fetch driver applications
      const { data: driverData, error: driverError } = await supabase
        .from('driver_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (driverError) throw driverError;

      // Transform driver data
      const formattedDriverData: DriverApplication[] = (driverData || []).map(app => {
        try {
          const vehicleInfo = typeof app.vehicle_info === 'string'
            ? JSON.parse(app.vehicle_info)
            : app.vehicle_info || { make: '', model: '', year: '', plate: '' };

          const documents = typeof app.documents === 'string'
            ? JSON.parse(app.documents)
            : app.documents || { drivers_license: null, insurance: null, vehicle_registration: null };

          return {
            id: app.id,
            first_name: app.first_name || '',
            last_name: app.last_name || '',
            email: app.email || '',
            phone: app.phone || '',
            status: (app.status as DriverApplication['status']) || 'pending',
            created_at: app.created_at || new Date().toISOString(),
            vehicle_info: {
              make: vehicleInfo.make || '',
              model: vehicleInfo.model || '',
              year: vehicleInfo.year || '',
              plate: vehicleInfo.plate || ''
            },
            documents: {
              drivers_license: documents.drivers_license,
              insurance: documents.insurance,
              vehicle_registration: documents.vehicle_registration
            }
          };
        } catch (err) {
          console.error('Error processing driver application:', err);
          return null;
        }
      }).filter(Boolean) as DriverApplication[];

      setDriverApplications(formattedDriverData);
    } catch (error: any) {
      console.error('Error fetching applications:', error);
      setError(error.message);
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = (application: Application) => {
    try {
      setSelectedApplication(application);
      setReviewNotes('');
      setReviewStatus('approved');
      setReviewDialogOpen(true);
      setError(null);
    } catch (err) {
      console.error('Error handling review:', err);
      toast.error('Failed to open review dialog');
    }
  };

  const submitReview = async () => {
    if (!selectedApplication) return;

    try {
      setLoading(true);
      setError(null);

      const isDriver = 'vehicle_info' in selectedApplication;
      const tableName = isDriver ? 'driver_applications' : 'merchant_applications';
      let userId = selectedApplication.user_id;

      // Update application status
      const { error: updateError } = await supabase
        .from(tableName)
        .update({
          status: reviewStatus,
          admin_notes: reviewNotes,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', selectedApplication.id);

      if (updateError) throw updateError;

      if (reviewStatus === 'approved') {
        // Create auth user with random password
        const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: selectedApplication.email,
          password: tempPassword,
          options: {
            data: {
              role: isDriver ? 'driver' : 'store_owner'
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          userId = authData.user.id;

          // Create or update user profile
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: authData.user.id,
              role: isDriver ? 'driver' : 'store_owner',
              first_name: selectedApplication.first_name,
              last_name: selectedApplication.last_name,
              phone: selectedApplication.phone,
              email: selectedApplication.email,
              status: 'active'
            });

          if (profileError) throw profileError;

          // Update application with user_id
          await supabase
            .from(tableName)
            .update({ user_id: authData.user.id })
            .eq('id', selectedApplication.id);

          // For merchants, create store
          if (!isDriver && 'business_name' in selectedApplication) {
            const merchantApp = selectedApplication as MerchantApplication;
            const { error: storeError } = await supabase
              .from('stores')
              .insert({
                owner_id: authData.user.id,
                name: merchantApp.business_name,
                slug: merchantApp.business_name.toLowerCase().replace(/\s+/g, '-'),
                description: merchantApp.business_description,
                address: merchantApp.business_address,
                contact_info: {
                  email: merchantApp.email,
                  phone: merchantApp.phone
                },
                business_hours: {},
                status: 'active'
              });

            if (storeError) throw storeError;
          }

          // For drivers, create driver status
          if (isDriver) {
            const { error: statusError } = await supabase
              .from('driver_status')
              .insert({
                driver_id: authData.user.id,
                is_online: false,
                last_updated: new Date().toISOString()
              });

            if (statusError) throw statusError;
          }

          // Send password reset email
          await supabase.auth.resetPasswordForEmail(selectedApplication.email, {
            redirectTo: `${window.location.origin}/auth/reset-password`
          });
        }
      }

      // Create notification
      if (userId) {
        await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: isDriver ? 'driver_application' : 'merchant_application',
            title: `Application ${reviewStatus}`,
            message: reviewStatus === 'approved'
              ? `Your ${isDriver ? 'driver' : 'merchant'} application has been approved! Please check your email for login instructions.`
              : reviewStatus === 'needs_info'
                ? `We need additional information for your ${isDriver ? 'driver' : 'merchant'} application. Please check your email.`
                : `Your ${isDriver ? 'driver' : 'merchant'} application has been rejected. Please check your email for details.`,
            read: false
          });
      }

      toast.success('Review submitted successfully');
      setReviewDialogOpen(false);
      await fetchApplications();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      setError(error.message);
      toast.error('Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'in_review':
        return <Badge className="bg-blue-100 text-blue-800">In Review</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      case 'needs_info':
        return <Badge className="bg-purple-100 text-purple-800">Needs Info</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
      </div>
    );
  }

  const renderApplicationCard = (application: Application, type: 'merchant' | 'driver') => (
    <Card key={application.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {application.first_name} {application.last_name}
            </CardTitle>
            <CardDescription>
              Applied {new Date(application.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          {getStatusBadge(application.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Contact Information */}
          <div>
            <h4 className="font-medium mb-2">Contact Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Email</p>
                <p>{application.email}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p>{application.phone}</p>
              </div>
            </div>
          </div>

          {/* Business/Vehicle Information */}
          {type === 'merchant' ? (
            <div>
              <h4 className="font-medium mb-2">Business Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Business Name</p>
                  <p>{application.business_name}</p>
                </div>
                <div>
                  <p className="text-gray-500">Business Type</p>
                  <p>{application.business_type}</p>
                </div>
              </div>
              <div className="mt-2">
                <p className="text-gray-500">Description</p>
                <p className="text-sm">{application.business_description}</p>
              </div>
            </div>
          ) : (
            <div>
              <h4 className="font-medium mb-2">Vehicle Information</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Vehicle</p>
                  <p>{application.vehicle_info.year} {application.vehicle_info.make} {application.vehicle_info.model}</p>
                </div>
                <div>
                  <p className="text-gray-500">License Plate</p>
                  <p>{application.vehicle_info.plate}</p>
                </div>
              </div>
            </div>
          )}

          {/* Documents */}
          <div>
            <h4 className="font-medium mb-2">Documents</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {type === 'merchant' ? (
                <>
                  <div>
                    <p className="text-gray-500">Business License</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => window.open(application.business_license_number)}>
                      View Document
                    </Button>
                  </div>
                  <div>
                    <p className="text-gray-500">Tax ID</p>
                    <p>{application.tax_id}</p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-gray-500">Driver's License</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => window.open(application.documents.drivers_license)}>
                      View Document
                    </Button>
                  </div>
                  <div>
                    <p className="text-gray-500">Insurance</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => window.open(application.documents.insurance)}>
                      View Document
                    </Button>
                  </div>
                  <div>
                    <p className="text-gray-500">Vehicle Registration</p>
                    <Button variant="link" className="p-0 h-auto" onClick={() => window.open(application.documents.vehicle_registration)}>
                      View Document
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {application.status !== 'approved' && application.status !== 'rejected' && (
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => handleReview(application)}
              >
                <Eye className="h-4 w-4 mr-2" />
                Review
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      
      <Tabs defaultValue="merchants">
        <TabsList>
          <TabsTrigger value="merchants" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Merchant Applications
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            Driver Applications
          </TabsTrigger>
        </TabsList>

        <TabsContent value="merchants" className="mt-6">
          {merchantApplications.length > 0 ? (
            merchantApplications.map(application => renderApplicationCard(application, 'merchant'))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Store className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">No Merchant Applications</p>
                <p className="text-sm text-gray-500">New applications will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="drivers" className="mt-6">
          {driverApplications.length > 0 ? (
            driverApplications.map(application => renderApplicationCard(application, 'driver'))
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64">
                <Truck className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900">No Driver Applications</p>
                <p className="text-sm text-gray-500">New applications will appear here</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Application</DialogTitle>
            <DialogDescription>
              Review and update the application status
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div className="flex gap-2">
              <Button
                variant={reviewStatus === 'approved' ? 'default' : 'outline'}
                className={reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                onClick={() => setReviewStatus('approved')}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant={reviewStatus === 'needs_info' ? 'default' : 'outline'}
                className={reviewStatus === 'needs_info' ? 'bg-purple-600 hover:bg-purple-700' : ''}
                onClick={() => setReviewStatus('needs_info')}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Need Info
              </Button>
              <Button
                variant={reviewStatus === 'rejected' ? 'default' : 'outline'}
                className={reviewStatus === 'rejected' ? 'bg-red-600 hover:bg-red-700' : ''}
                onClick={() => setReviewStatus('rejected')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Review Notes</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Enter your review notes..."
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReviewDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={submitReview}
                disabled={loading}
              >
                Submit Review
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMerchantApprovals; 