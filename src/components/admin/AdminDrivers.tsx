import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/sonner';
import { 
  Truck, 
  UserCheck, 
  UserX, 
  Eye, 
  Search, 
  Plus,
  MapPin,
  Phone,
  Mail,
  Star,
  Activity,
  DollarSign,
  Calendar
} from 'lucide-react';
import { handleApplicationApproval } from '@/lib/utils';

interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending' | 'rejected';
  license_number: string;
  vehicle_info: {
    make: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
  };
  rating: number;
  total_deliveries: number;
  earnings_total: number;
  created_at: string;
  last_active: string | null;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
  };
  admin_notes?: string | null;
  reviewed_by?: any;
  reviewed_at?: string | null;
}

interface DriverApplication {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  driver_license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_color?: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  address: any;
  status: string;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  reviewer?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  };
}

interface NewDriver {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  driver_license_number: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_year: number;
  vehicle_plate: string;
  vehicle_color: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    postal_code: string;
  };
}

export const AdminDrivers = () => {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addDriverOpen, setAddDriverOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newDriver, setNewDriver] = useState<NewDriver>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    driver_license_number: '',
    vehicle_make: '',
    vehicle_model: '',
    vehicle_year: new Date().getFullYear(),
    vehicle_plate: '',
    vehicle_color: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      postal_code: ''
    }
  });

  useEffect(() => {
    fetchDrivers();
  }, [statusFilter]);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      // Fetch driver applications with their profiles
      const { data: driverApps, error: driverError } = await supabase
        .from('driver_applications')
        .select(`
          *,
          reviewer:reviewed_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (driverError) throw driverError;

      // Format driver data
      const formattedDrivers = (driverApps || []).map((driver: DriverApplication) => ({
        id: driver.id,
        first_name: driver.first_name,
        last_name: driver.last_name,
        email: driver.email,
        phone: driver.phone,
        status: driver.status as Driver['status'],
        license_number: driver.driver_license_number,
        vehicle_info: {
          make: driver.vehicle_make,
          model: driver.vehicle_model,
          year: driver.vehicle_year,
          plate_number: driver.vehicle_plate,
          color: driver.vehicle_color || 'Not specified'
        },
        rating: 0, // New drivers start with 0 rating
        total_deliveries: 0, // New drivers start with 0 deliveries
        earnings_total: 0, // New drivers start with 0 earnings
        created_at: driver.created_at,
        last_active: null, // Will be updated when they start delivering
        address: driver.address || {
          street: '',
          city: '',
          state: '',
          postal_code: ''
        },
        admin_notes: driver.admin_notes,
        reviewed_by: driver.reviewer,
        reviewed_at: driver.reviewed_at
      }));

      let filteredDrivers = formattedDrivers;
      if (statusFilter !== 'all') {
        filteredDrivers = formattedDrivers.filter(driver => driver.status === statusFilter);
      }

      setDrivers(filteredDrivers);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const updateDriverStatus = async (driverId: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      // Update driver application status
      const { error: updateError } = await supabase
        .from('driver_applications')
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (updateError) throw updateError;

      // Get driver application details
      const { data: driverApp } = await supabase
        .from('driver_applications')
        .select('*')
        .eq('id', driverId)
        .single();

      if (driverApp) {
        // If approved, create auth user and profile
        if (status === 'active') {
          // Create auth user
          const tempPassword = Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12);
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email: driverApp.email,
            password: tempPassword,
            options: {
              data: {
                role: 'driver'
              }
            }
          });

          if (authError) throw authError;

          // Create profile
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: authData.user?.id,
              first_name: driverApp.first_name,
              last_name: driverApp.last_name,
              email: driverApp.email,
              phone: driverApp.phone,
              role: 'driver',
              status: 'active'
            });

          if (profileError) throw profileError;

          // Send welcome email with password reset link
          const { error: resetError } = await supabase.auth.resetPasswordForEmail(
            driverApp.email,
            {
              redirectTo: `${window.location.origin}/auth/reset-password`
            }
          );

          if (resetError) throw resetError;
        }

        // Send notification
        await supabase
          .from('notifications')
          .insert({
            user_id: driverId, // Using application ID until profile is created
            title: `Driver Application ${status === 'active' ? 'Approved' : 'Updated'}`,
            message: `Your driver application has been ${status === 'active' ? 'approved' : status}. ${
              status === 'active' 
                ? 'Please check your email for login instructions.' 
                : status === 'inactive' 
                ? 'Please contact support for more information.'
                : 'Your account has been suspended.'
            }`,
            type: 'driver_application',
            related_id: driverId
          });
      }

      // Update local state
      setDrivers(prev => 
        prev.map(driver => 
          driver.id === driverId ? { ...driver, status } : driver
        )
      );

      toast.success(`Driver status updated to ${status}`);
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Failed to update driver status');
    }
  };

  const addNewDriver = async () => {
    try {
      // Create driver application
      const { data: driverApp, error: driverError } = await supabase
        .from('driver_applications')
        .insert({
          first_name: newDriver.first_name,
          last_name: newDriver.last_name,
          email: newDriver.email,
          phone: newDriver.phone,
          date_of_birth: newDriver.date_of_birth,
          driver_license_number: newDriver.driver_license_number,
          vehicle_make: newDriver.vehicle_make,
          vehicle_model: newDriver.vehicle_model,
          vehicle_year: newDriver.vehicle_year,
          vehicle_plate: newDriver.vehicle_plate,
          vehicle_color: newDriver.vehicle_color,
          emergency_contact_name: newDriver.emergency_contact_name,
          emergency_contact_phone: newDriver.emergency_contact_phone,
          address: newDriver.address,
          status: 'pending'
        })
        .select()
        .single();

      if (driverError) throw driverError;

      // Send notification to admins
      const { data: admins } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (admins) {
        await Promise.all(admins.map(admin => 
          supabase
            .from('notifications')
            .insert({
              user_id: admin.id,
              title: 'New Driver Application',
              message: `${newDriver.first_name} ${newDriver.last_name} has applied to be a driver.`,
              type: 'driver_application',
              related_id: driverApp.id
            })
        ));
      }

      setAddDriverOpen(false);
      setNewDriver({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        date_of_birth: '',
        driver_license_number: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_year: new Date().getFullYear(),
        vehicle_plate: '',
        vehicle_color: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          postal_code: ''
        }
      });

      toast.success('Driver application submitted successfully');
      fetchDrivers(); // Refresh the list
    } catch (error) {
      console.error('Error adding driver:', error);
      toast.error('Failed to add driver');
    }
  };

  const openDriverDialog = (driver: Driver) => {
    setSelectedDriver(driver);
    setDialogOpen(true);
  };

  const filteredDrivers = drivers.filter(driver => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        driver.first_name.toLowerCase().includes(searchLower) ||
        driver.last_name.toLowerCase().includes(searchLower) ||
        driver.email.toLowerCase().includes(searchLower) ||
        driver.phone.includes(searchTerm) ||
        driver.license_number.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-beauty-purple"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Driver Management</h2>
          <p className="text-gray-600">Manage delivery drivers and their information</p>
        </div>
        <Button onClick={() => setAddDriverOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Driver
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search drivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Drivers</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drivers List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDrivers.map((driver) => (
          <Card key={driver.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {driver.first_name} {driver.last_name}
                  </h3>
                  <p className="text-sm text-gray-600">{driver.email}</p>
                </div>
                <Badge className={getStatusColor(driver.status)} variant="secondary">
                  {driver.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-3 w-3 text-gray-400" />
                  <span>{driver.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck className="h-3 w-3 text-gray-400" />
                  <span>{driver.vehicle_info.make} {driver.vehicle_info.model}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span>{driver.rating.toFixed(1)} rating</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-500">Deliveries</p>
                  <p className="font-semibold">{driver.total_deliveries}</p>
                </div>
                <div>
                  <p className="text-gray-500">Earnings</p>
                  <p className="font-semibold">${driver.earnings_total.toLocaleString()}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDriverDialog(driver)}
                  className="flex-1"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </Button>
                
                {driver.status === 'active' ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateDriverStatus(driver.id, 'inactive')}
                    className="text-red-600 border-red-300"
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateDriverStatus(driver.id, 'active')}
                    className="text-green-600 border-green-300"
                  >
                    <UserCheck className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDrivers.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No drivers found</h3>
            <p className="text-gray-600">
              {searchTerm ? 'Try adjusting your search terms' : 'No drivers to display'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Driver Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Driver Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedDriver && (
            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Name</Label>
                  <p>{selectedDriver.first_name} {selectedDriver.last_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedDriver.status)} variant="secondary">
                    {selectedDriver.status}
                  </Badge>
                </div>
                <div>
                  <Label className="font-medium">Email</Label>
                  <p>{selectedDriver.email}</p>
                </div>
                <div>
                  <Label className="font-medium">Phone</Label>
                  <p>{selectedDriver.phone}</p>
                </div>
                <div>
                  <Label className="font-medium">License Number</Label>
                  <p>{selectedDriver.license_number}</p>
                </div>
                <div>
                  <Label className="font-medium">Joined</Label>
                  <p>{new Date(selectedDriver.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Vehicle Info */}
              <div>
                <h4 className="font-semibold mb-4">Vehicle Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="font-medium">Make & Model</Label>
                    <p>{selectedDriver.vehicle_info.make} {selectedDriver.vehicle_info.model}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Year</Label>
                    <p>{selectedDriver.vehicle_info.year}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Plate Number</Label>
                    <p>{selectedDriver.vehicle_info.plate_number}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Color</Label>
                    <p>{selectedDriver.vehicle_info.color}</p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h4 className="font-semibold mb-4">Address</h4>
                <p>{selectedDriver.address.street}</p>
                <p>{selectedDriver.address.city}, {selectedDriver.address.state} {selectedDriver.address.postal_code}</p>
              </div>

              {/* Performance Stats */}
              <div>
                <h4 className="font-semibold mb-4">Performance</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedDriver.rating.toFixed(1)}</p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Activity className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">{selectedDriver.total_deliveries}</p>
                    <p className="text-sm text-gray-600">Deliveries</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <p className="text-2xl font-bold">${selectedDriver.earnings_total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Earnings</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Select
                  value={selectedDriver.status}
                  onValueChange={(value: any) => updateDriverStatus(selectedDriver.id, value)}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Driver Dialog */}
      <Dialog open={addDriverOpen} onOpenChange={setAddDriverOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Driver</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Personal Info */}
            <div>
              <h4 className="font-semibold mb-4">Personal Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={newDriver.first_name}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newDriver.last_name}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newDriver.email}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={newDriver.date_of_birth}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="license">License Number</Label>
                  <Input
                    id="license"
                    value={newDriver.driver_license_number}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, driver_license_number: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Info */}
            <div>
              <h4 className="font-semibold mb-4">Vehicle Information</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vehicleMake">Make</Label>
                  <Input
                    id="vehicleMake"
                    value={newDriver.vehicle_make}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicle_make: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleModel">Model</Label>
                  <Input
                    id="vehicleModel"
                    value={newDriver.vehicle_model}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicle_model: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleYear">Year</Label>
                  <Input
                    id="vehicleYear"
                    type="number"
                    value={newDriver.vehicle_year}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicle_year: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="vehiclePlate">Plate Number</Label>
                  <Input
                    id="vehiclePlate"
                    value={newDriver.vehicle_plate}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicle_plate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="vehicleColor">Color</Label>
                  <Input
                    id="vehicleColor"
                    value={newDriver.vehicle_color}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicle_color: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div>
              <h4 className="font-semibold mb-4">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyName">Name</Label>
                  <Input
                    id="emergencyName"
                    value={newDriver.emergency_contact_name}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, emergency_contact_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={newDriver.emergency_contact_phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, emergency_contact_phone: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h4 className="font-semibold mb-4">Address</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="addressStreet">Street Address</Label>
                  <Input
                    id="addressStreet"
                    value={newDriver.address.street}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, address: { ...prev.address, street: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label htmlFor="addressCity">City</Label>
                  <Input
                    id="addressCity"
                    value={newDriver.address.city}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, address: { ...prev.address, city: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label htmlFor="addressState">State</Label>
                  <Input
                    id="addressState"
                    value={newDriver.address.state}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, address: { ...prev.address, state: e.target.value } }))}
                  />
                </div>
                <div>
                  <Label htmlFor="addressPostal">Postal Code</Label>
                  <Input
                    id="addressPostal"
                    value={newDriver.address.postal_code}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, address: { ...prev.address, postal_code: e.target.value } }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button onClick={addNewDriver} className="flex-1">
                Add Driver
              </Button>
              <Button
                variant="outline"
                onClick={() => setAddDriverOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}; 