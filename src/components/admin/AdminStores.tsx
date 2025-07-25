import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Eye, Clock, Users, DollarSign, BarChart3, Store, MapPin, Search, Upload, Download, FileSpreadsheet, CheckCircle } from "lucide-react";

interface StoreHours {
  day: string;
  open_time: string;
  close_time: string;
  is_closed: boolean;
}

interface StoreWithDetails {
  id: string;
  name: string;
  slug: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  status: string;
  commission_rate: number;
  created_at: string;
  store_hours: StoreHours[];
  owner_details: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  managers: {
    id: string;
    name: string;
    email: string;
    role: string;
  }[];
  stats: {
    total_orders: number;
    total_revenue: number;
    commission_earned: number;
    active_products: number;
    average_order_value: number;
    monthly_orders: number;
    monthly_revenue: number;
  };
}

export const AdminStores = () => {
  const [stores, setStores] = useState<StoreWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreWithDetails | null>(null);
  const [selectedStore, setSelectedStore] = useState<StoreWithDetails | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    address: "",
    phone: "",
    email: "",
    status: "active" as "active" | "inactive" | "pending",
    commission_rate: "5",
  });

  const [hoursData, setHoursData] = useState<StoreHours[]>([
    { day: "Monday", open_time: "09:00", close_time: "17:00", is_closed: false },
    { day: "Tuesday", open_time: "09:00", close_time: "17:00", is_closed: false },
    { day: "Wednesday", open_time: "09:00", close_time: "17:00", is_closed: false },
    { day: "Thursday", open_time: "09:00", close_time: "17:00", is_closed: false },
    { day: "Friday", open_time: "09:00", close_time: "17:00", is_closed: false },
    { day: "Saturday", open_time: "10:00", close_time: "16:00", is_closed: false },
    { day: "Sunday", open_time: "10:00", close_time: "16:00", is_closed: true },
  ]);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data: storesData, error: storesError } = await supabase
        .from("stores")
        .select("*")
        .order("created_at", { ascending: false });

      if (storesError) throw storesError;

      // Fetch detailed data for each store
      const storesWithDetails = await Promise.all(
        (storesData || []).map(async (store) => {
          // Get store hours
          const { data: hours } = await supabase
            .from("store_hours")
            .select("*")
            .eq("store_id", store.id)
            .order("day_of_week");

          // Get store managers
          const { data: managers } = await supabase
            .from("store_managers")
            .select(`
              *,
              profiles (
                first_name,
                last_name,
                email
              )
            `)
            .eq("store_id", store.id);

          // Get owner details
          const { data: ownerProfile } = await supabase
            .from("profiles")
            .select("id, first_name, last_name, email, phone")
            .eq("id", store.owner_id)
            .single();

          // Get order statistics
          const { data: orderStats } = await supabase
            .from("orders")
            .select("total_amount, created_at")
            .contains("order_items", `[{"stores":{"id":"${store.id}"}}]`);

          // Get product count
          const { data: products } = await supabase
            .from("products")
            .select("id")
            .eq("store_id", store.id)
            .eq("status", "active");

          // Calculate statistics
          const totalOrders = orderStats?.length || 0;
          const totalRevenue = orderStats?.reduce((sum, order) => sum + order.total_amount, 0) || 0;
          const commissionEarned = totalRevenue * (store.commission_rate / 100);
          const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

          // Get current month stats
          const currentMonth = new Date().toISOString().slice(0, 7);
          const monthlyOrders = orderStats?.filter(order => 
            order.created_at.startsWith(currentMonth)
          ).length || 0;
          const monthlyRevenue = orderStats?.filter(order => 
            order.created_at.startsWith(currentMonth)
          ).reduce((sum, order) => sum + order.total_amount, 0) || 0;

          // Format store hours
          const formattedHours = hours?.map(hour => ({
            day: getDayName(hour.day_of_week),
            open_time: hour.open_time,
            close_time: hour.close_time,
            is_closed: hour.is_closed
          })) || [];

          return {
            ...store,
            store_hours: formattedHours,
            owner_details: ownerProfile ? {
              id: ownerProfile.id,
              name: `${ownerProfile.first_name} ${ownerProfile.last_name}`,
              email: ownerProfile.email || '',
              phone: ownerProfile.phone || ''
            } : { id: '', name: 'Unknown', email: '', phone: '' },
            managers: managers?.map(manager => ({
              id: manager.id,
              name: `${manager.profiles?.first_name} ${manager.profiles?.last_name}`,
              email: manager.profiles?.email || '',
              role: manager.role
            })) || [],
            stats: {
              total_orders: totalOrders,
              total_revenue: totalRevenue,
              commission_earned: commissionEarned,
              active_products: products?.length || 0,
              average_order_value: averageOrderValue,
              monthly_orders: monthlyOrders,
              monthly_revenue: monthlyRevenue
            }
          };
        })
      );

      setStores(storesWithDetails);
    } catch (error) {
      console.error("Error fetching stores:", error);
      toast({
        title: "Error",
        description: "Failed to fetch stores",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDayName = (dayOfWeek: number): string => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek] || 'Unknown';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const storeData = {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        status: formData.status,
        commission_rate: parseFloat(formData.commission_rate),
      };

      let storeId = editingStore?.id;

      if (editingStore) {
        const { error } = await supabase
          .from("stores")
          .update(storeData)
          .eq("id", editingStore.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("stores")
          .insert([storeData])
          .select()
          .single();
        if (error) throw error;
        storeId = data.id;
      }

      // Update store hours
      if (storeId) {
        // Delete existing hours
        await supabase
          .from("store_hours")
          .delete()
          .eq("store_id", storeId);

        // Insert new hours
        const hoursInserts = hoursData.map((hour, index) => ({
          store_id: storeId,
          day_of_week: getDayOfWeek(hour.day),
          open_time: hour.open_time,
          close_time: hour.close_time,
          is_closed: hour.is_closed
        }));

        await supabase
          .from("store_hours")
          .insert(hoursInserts);
      }

      toast({
        title: "Success",
        description: `Store ${editingStore ? "updated" : "created"} successfully`,
      });
      setDialogOpen(false);
      resetForm();
      fetchStores();
    } catch (error) {
      console.error("Error saving store:", error);
      toast({
        title: "Error",
        description: "Failed to save store",
        variant: "destructive",
      });
    }
  };

  const getDayOfWeek = (dayName: string): number => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      description: "",
      address: "",
      phone: "",
      email: "",
      status: "active",
      commission_rate: "5",
    });
    setHoursData([
      { day: "Monday", open_time: "09:00", close_time: "17:00", is_closed: false },
      { day: "Tuesday", open_time: "09:00", close_time: "17:00", is_closed: false },
      { day: "Wednesday", open_time: "09:00", close_time: "17:00", is_closed: false },
      { day: "Thursday", open_time: "09:00", close_time: "17:00", is_closed: false },
      { day: "Friday", open_time: "09:00", close_time: "17:00", is_closed: false },
      { day: "Saturday", open_time: "10:00", close_time: "16:00", is_closed: false },
      { day: "Sunday", open_time: "10:00", close_time: "16:00", is_closed: true },
    ]);
    setEditingStore(null);
  };

  const openEditDialog = (store: StoreWithDetails) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      slug: store.slug,
      description: store.description || "",
      address: store.address || "",
      phone: store.phone || "",
      email: store.email || "",
      status: store.status as any,
      commission_rate: store.commission_rate.toString(),
    });
    setHoursData(store.store_hours.length > 0 ? store.store_hours : hoursData);
    setDialogOpen(true);
  };

  const openDetailsDialog = (store: StoreWithDetails) => {
    setSelectedStore(store);
    setDetailsDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "inactive":
        return "secondary";
      case "pending":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const filteredStores = stores.filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         store.owner_details.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || store.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div>Loading stores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Store Management</h2>
          <p className="text-gray-600">Manage stores with comprehensive analytics and details</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingStore ? "Edit Store" : "Add New Store"}
              </DialogTitle>
            </DialogHeader>

            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="hours">Store Hours</TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit}>
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Store Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="slug">Slug</Label>
                      <Input
                        id="slug"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={formData.commission_rate}
                        onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      rows={2}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="hours" className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Store Operating Hours</h3>
                    {hoursData.map((hour, index) => (
                      <div key={hour.day} className="flex items-center space-x-4 p-4 border rounded">
                        <div className="w-24">
                          <Label className="font-medium">{hour.day}</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!hour.is_closed}
                            onChange={(e) => {
                              const newHours = [...hoursData];
                              newHours[index].is_closed = !e.target.checked;
                              setHoursData(newHours);
                            }}
                          />
                          <Label className="text-sm">Open</Label>
                        </div>
                        {!hour.is_closed && (
                          <>
                            <div>
                              <Label className="text-sm">Open Time</Label>
                              <Input
                                type="time"
                                value={hour.open_time}
                                onChange={(e) => {
                                  const newHours = [...hoursData];
                                  newHours[index].open_time = e.target.value;
                                  setHoursData(newHours);
                                }}
                                className="w-32"
                              />
                            </div>
                            <div>
                              <Label className="text-sm">Close Time</Label>
                              <Input
                                type="time"
                                value={hour.close_time}
                                onChange={(e) => {
                                  const newHours = [...hoursData];
                                  newHours[index].close_time = e.target.value;
                                  setHoursData(newHours);
                                }}
                                className="w-32"
                              />
                            </div>
                          </>
                        )}
                        {hour.is_closed && (
                          <span className="text-gray-500 italic">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <div className="flex justify-end space-x-2 mt-6">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingStore ? "Update" : "Create"} Store
                  </Button>
                </div>
              </form>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Store Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Store className="h-5 w-5" />
              <span>{selectedStore?.name} - Store Details</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedStore && (
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
                <TabsTrigger value="hours">Hours</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStore.stats.total_orders}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${selectedStore.stats.total_revenue.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Commission Earned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">
                        ${selectedStore.stats.commission_earned.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {selectedStore.commission_rate}% commission rate
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Store Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Address</Label>
                        <p className="text-sm text-gray-600">{selectedStore.address}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Contact</Label>
                        <p className="text-sm text-gray-600">{selectedStore.email}</p>
                        <p className="text-sm text-gray-600">{selectedStore.phone}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Status</Label>
                        <div className="mt-1">
                          <Badge variant={getStatusColor(selectedStore.status)}>
                            {selectedStore.status}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Owner Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <Label className="text-sm font-medium">Name</Label>
                        <p className="text-sm text-gray-600">{selectedStore.owner_details.name}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Email</Label>
                        <p className="text-sm text-gray-600">{selectedStore.owner_details.email}</p>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Phone</Label>
                        <p className="text-sm text-gray-600">{selectedStore.owner_details.phone}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Active Products</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStore.stats.active_products}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Average Order</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${selectedStore.stats.average_order_value.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Monthly Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedStore.stats.monthly_orders}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Monthly Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${selectedStore.stats.monthly_revenue.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Commission Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Commission Rate:</span>
                        <Badge variant="outline">{selectedStore.commission_rate}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Revenue:</span>
                        <span className="font-medium">${selectedStore.stats.total_revenue.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Total Commission:</span>
                        <span className="font-medium text-green-600">${selectedStore.stats.commission_earned.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Store Net Revenue:</span>
                        <span className="font-medium">${(selectedStore.stats.total_revenue - selectedStore.stats.commission_earned).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="hours" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Clock className="h-5 w-5" />
                      <span>Operating Hours</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedStore.store_hours.map((hour) => (
                        <div key={hour.day} className="flex justify-between items-center py-2 border-b">
                          <span className="font-medium">{hour.day}</span>
                          {hour.is_closed ? (
                            <Badge variant="secondary">Closed</Badge>
                          ) : (
                            <span className="text-sm text-gray-600">
                              {hour.open_time} - {hour.close_time}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Users className="h-5 w-5" />
                      <span>Store Team</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="border rounded p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Store Owner</h4>
                            <p className="text-sm text-gray-600">{selectedStore.owner_details.name}</p>
                            <p className="text-sm text-gray-500">{selectedStore.owner_details.email}</p>
                          </div>
                          <Badge variant="default">Owner</Badge>
                        </div>
                      </div>

                      {selectedStore.managers.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="font-medium">Store Managers</h4>
                          {selectedStore.managers.map((manager) => (
                            <div key={manager.id} className="border rounded p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{manager.name}</p>
                                  <p className="text-sm text-gray-500">{manager.email}</p>
                                </div>
                                <Badge variant="outline">{manager.role}</Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No managers assigned to this store
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search stores by name, address, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Stores ({filteredStores.length})</CardTitle>
          <CardDescription>Manage stores with comprehensive details and analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Store Name</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{store.name}</p>
                      <p className="text-sm text-gray-500">{store.address}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{store.owner_details.name}</p>
                      <p className="text-sm text-gray-500">{store.owner_details.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{store.stats.total_orders}</p>
                      <p className="text-sm text-gray-500">{store.stats.monthly_orders} this month</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">${store.stats.total_revenue.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">${store.stats.monthly_revenue.toFixed(2)} monthly</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-green-600">${store.stats.commission_earned.toFixed(2)}</p>
                      <p className="text-sm text-gray-500">{store.commission_rate}% rate</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(store.status)}>
                      {store.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openDetailsDialog(store)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(store)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
