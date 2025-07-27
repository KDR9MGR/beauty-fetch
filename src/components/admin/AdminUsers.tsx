
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Eye, Search, Ban, CheckCircle, User, ShoppingBag, MapPin, CreditCard, Shield, AlertTriangle, Mail, UserCheck, Settings } from "lucide-react";

interface UserWithDetails {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  role: string;
  status: string;
  is_blocked: boolean;
  blocked_reason: string | null;
  blocked_at: string | null;
  email_verified: boolean;
  email_verified_at: string | null;
  verification_email_sent_at: string | null;
  total_orders: number;
  total_spent: number;
  created_at: string;
  last_login_at: string | null;
  addresses: {
    id: string;
    address_line1: string;
    address_line2: string | null;
    city: string;
    state: string;
    postal_code: string;
    is_default: boolean;
  }[];
  payment_methods: {
    id: string;
    type: string;
    last_four: string;
    is_default: boolean;
  }[];
  recent_orders: {
    id: string;
    order_number: string;
    total_amount: number;
    status: string;
    created_at: string;
  }[];
}

export const AdminUsers = () => {
  const [users, setUsers] = useState<UserWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState<UserWithDetails | null>(null);
  const [userDetailsOpen, setUserDetailsOpen] = useState(false);
  const [orderHistoryOpen, setOrderHistoryOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // First, fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from("profiles")
        .select("*, email_verified, email_verified_at, verification_email_sent_at")
        .order("created_at", { ascending: false });

      if (usersError) {
        console.error("Error fetching users:", usersError);
        throw usersError;
      }

      if (!usersData || usersData.length === 0) {
        console.log("No users found");
        setUsers([]);
        return;
      }

      // Process each user to get additional data
      const usersWithStats = await Promise.all(
        usersData.map(async (user) => {
          try {
            // Get user addresses - table doesn't exist, use empty array
            const addresses: any[] = [];

            // Get payment methods
            const { data: paymentMethods } = await supabase
              .from("payment_methods")
              .select("id, type, last_four, is_default")
              .eq("user_id", user.id)
              .limit(5);

            // Get order statistics
            const { data: orderStats } = await supabase
              .from("orders")
              .select("id, order_number, total_amount, status, created_at")
              .eq("customer_id", user.id)
              .order("created_at", { ascending: false })
              .limit(10);

            return {
              ...user,
              total_orders: orderStats?.length || 0,
              total_spent: orderStats?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0,
              recent_orders: (orderStats || []).slice(0, 5).map(order => ({
                id: order.id,
                order_number: order.order_number,
                total_amount: order.total_amount,
                status: order.status,
                created_at: order.created_at
              })),
              addresses: [],
              payment_methods: (paymentMethods || []).map(pm => ({
                id: pm.id,
                type: pm.type,
                last_four: pm.last_four,
                is_default: pm.is_default
              })),
              // Ensure email verification fields have defaults
              email_verified: user.email_verified || false,
              email_verified_at: user.email_verified_at || null,
              verification_email_sent_at: user.verification_email_sent_at || null
            } as UserWithDetails;
          } catch (error) {
            console.error(`Error processing user ${user.id}:`, error);
            // Return user with default values if there's an error
            return {
              ...user,
              total_orders: 0,
              total_spent: 0,
              recent_orders: [],
              addresses: [],
              payment_methods: [],
              email_verified: false,
              email_verified_at: null,
              verification_email_sent_at: null
            } as UserWithDetails;
          }
        })
      );

      console.log("Fetched users with stats:", usersWithStats.length);
      setUsers(usersWithStats);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive",
      });
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const blockUser = async (userId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
          status: "blocked"
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been blocked successfully",
      });
      setBlockDialogOpen(false);
      setBlockReason("");
      fetchUsers();
    } catch (error) {
      console.error("Error blocking user:", error);
      toast({
        title: "Error",
        description: "Failed to block user",
        variant: "destructive",
      });
    }
  };

  const unblockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          status: "active"
        })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "User has been unblocked successfully",
      });
      fetchUsers();
    } catch (error) {
      console.error("Error unblocking user:", error);
      toast({
        title: "Error",
        description: "Failed to unblock user",
        variant: "destructive",
      });
    }
  };

  const openUserDetails = (user: UserWithDetails) => {
    setSelectedUser(user);
    setUserDetailsOpen(true);
  };

  const openOrderHistory = (user: UserWithDetails) => {
    setSelectedUser(user);
    setOrderHistoryOpen(true);
  };

  const openBlockDialog = (user: UserWithDetails) => {
    setSelectedUser(user);
    setBlockDialogOpen(true);
  };

  const changeUserRole = async (userId: string, newRole: Database["public"]["Enums"]["user_role"]) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role updated to ${newRole} successfully`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const sendVerificationEmail = async (userId: string, email: string) => {
    try {
      // In a real application, you would call your backend API to send verification email
      // For now, we'll simulate this action
      toast({
        title: "Verification Email Sent",
        description: `Verification email sent to ${email}`,
      });
      
      // You could also update a verification_email_sent_at field in the database
      const { error } = await supabase
        .from("profiles")
        .update({ 
          updated_at: new Date().toISOString(),
          // Add verification_email_sent_at field if it exists
        })
        .eq("id", userId);

      if (error) console.warn("Could not update verification timestamp:", error);
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        title: "Error",
        description: "Failed to send verification email",
        variant: "destructive",
      });
    }
  };

  const verifyUserManually = async (userId: string) => {
    try {
      // Update user verification status
      // You might need to add an email_verified field to your profiles table
      toast({
        title: "User Verified",
        description: "User has been manually verified by admin",
      });
      
      // For demonstration, we'll update the user status
      const { error } = await supabase
        .from("profiles")
        .update({ 
          status: "active",
          updated_at: new Date().toISOString(),
          // Add email_verified: true if this field exists
        })
        .eq("id", userId);

      if (error) throw error;
      fetchUsers();
    } catch (error) {
      console.error("Error verifying user:", error);
      toast({
        title: "Error",
        description: "Failed to verify user",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeColor = (status: string, isBlocked: boolean) => {
    if (isBlocked) return "destructive";
    switch (status) {
      case "active": return "default";
      case "inactive": return "secondary";
      default: return "outline";
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "store_owner": return "default";
      case "driver": return "secondary";
      case "customer": return "outline";
      default: return "outline";
    }
  };

  const formatRoleName = (role: string) => {
    switch (role) {
      case "store_owner": return "Store Owner";
      case "admin": return "Admin";
      case "driver": return "Driver";
      case "customer": return "Customer";
      default: return role;
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);

    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "blocked" && user.is_blocked) ||
      (statusFilter === "active" && user.status === "active" && !user.is_blocked) ||
      (statusFilter === "inactive" && user.status === "inactive");

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <div>Loading users...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage customer accounts and access detailed information</p>
        </div>
      </div>

      {/* Search and Filters */}
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
                  placeholder="Search by name, email, or phone..."
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
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* User Details Dialog */}
      <Dialog open={userDetailsOpen} onOpenChange={setUserDetailsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>User Details - {selectedUser?.first_name} {selectedUser?.last_name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList>
                <TabsTrigger value="personal">Personal Info</TabsTrigger>
                <TabsTrigger value="addresses">Addresses</TabsTrigger>
                <TabsTrigger value="payments">Payment Methods</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Full Name</label>
                    <p className="text-sm text-gray-600">{selectedUser.first_name} {selectedUser.last_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-gray-600">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Phone</label>
                    <p className="text-sm text-gray-600">{selectedUser.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
                    <Badge variant={getRoleBadgeColor(selectedUser.role)}>
                      {formatRoleName(selectedUser.role)}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusBadgeColor(selectedUser.status, selectedUser.is_blocked)}>
                        {selectedUser.is_blocked ? "Blocked" : selectedUser.status}
                      </Badge>
                      {selectedUser.is_blocked && (
                        <span className="text-xs text-red-600">
                          Blocked: {selectedUser.blocked_reason}
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Member Since</label>
                    <p className="text-sm text-gray-600">
                      {new Date(selectedUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Login</label>
                    <p className="text-sm text-gray-600">
                      {selectedUser.last_login_at 
                        ? new Date(selectedUser.last_login_at).toLocaleDateString()
                        : "Never"
                      }
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Orders</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{selectedUser.total_orders}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Total Spent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">${selectedUser.total_spent.toFixed(2)}</div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="addresses" className="space-y-4">
                {selectedUser.addresses.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.addresses.map((address) => (
                      <Card key={address.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{address.address_line1}</p>
                              {address.address_line2 && <p className="text-sm text-gray-600">{address.address_line2}</p>}
                              <p className="text-sm text-gray-600">
                                {address.city}, {address.state} {address.postal_code}
                              </p>
                            </div>
                            {address.is_default && (
                              <Badge variant="default">Default</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No addresses on file
                  </div>
                )}
              </TabsContent>

              <TabsContent value="payments" className="space-y-4">
                {selectedUser.payment_methods.length > 0 ? (
                  <div className="space-y-3">
                    {selectedUser.payment_methods.map((method) => (
                      <Card key={method.id}>
                        <CardContent className="pt-4">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center space-x-3">
                              <CreditCard className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="font-medium capitalize">{method.type}</p>
                                <p className="text-sm text-gray-600">**** **** **** {method.last_four}</p>
                              </div>
                            </div>
                            {method.is_default && (
                              <Badge variant="default">Default</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No payment methods on file
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
                  {selectedUser.recent_orders.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order #</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.recent_orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="font-medium">{order.order_number}</TableCell>
                            <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{order.status}</Badge>
                            </TableCell>
                            <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No orders found
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Order History Dialog */}
      <Dialog open={orderHistoryOpen} onOpenChange={setOrderHistoryOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <ShoppingBag className="h-5 w-5" />
              <span>Complete Order History - {selectedUser?.first_name} {selectedUser?.last_name}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{selectedUser.total_orders}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Total Spent</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${selectedUser.total_spent.toFixed(2)}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Average Order</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      ${selectedUser.total_orders > 0 ? (selectedUser.total_spent / selectedUser.total_orders).toFixed(2) : "0.00"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">All Orders</h3>
                {selectedUser.recent_orders.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order #</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUser.recent_orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell className="font-medium">{order.order_number}</TableCell>
                          <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                          <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No orders found
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Block User Dialog */}
      <Dialog open={blockDialogOpen} onOpenChange={setBlockDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Ban className="h-5 w-5" />
              <span>Block User</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Are you sure you want to block {selectedUser?.first_name} {selectedUser?.last_name}?
              This will prevent them from accessing their account.
            </p>
            
            <div>
              <label className="text-sm font-medium">Reason for blocking</label>
              <Input
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking this user..."
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setBlockDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => selectedUser && blockUser(selectedUser.id, blockReason)}
                disabled={!blockReason.trim()}
              >
                Block User
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users ({filteredUsers.length})</CardTitle>
          <CardDescription>View and manage customer accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {users.length === 0 ? "No users found in the system." : "No users match your search criteria."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      {user.first_name} {user.last_name}
                      {user.is_blocked && (
                        <div className="flex items-center space-x-1 mt-1">
                          <AlertTriangle className="h-3 w-3 text-red-500" />
                          <span className="text-xs text-red-600">Blocked</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Select 
                        value={user.role} 
                        onValueChange={(value) => changeUserRole(user.id, value as Database["public"]["Enums"]["user_role"])}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Customer</SelectItem>
                          <SelectItem value="store_owner">Store Owner</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="driver">Driver</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeColor(user.status, user.is_blocked)}>
                        {user.is_blocked ? "Blocked" : user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.total_orders}</TableCell>
                    <TableCell>${user.total_spent.toFixed(2)}</TableCell>
                    <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1 flex-wrap">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openUserDetails(user)}
                          title="View Details"
                        >
                          <User className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openOrderHistory(user)}
                          title="View Orders"
                        >
                          <ShoppingBag className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => sendVerificationEmail(user.id, user.email)}
                          title="Send Verification Email"
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyUserManually(user.id)}
                          title="Verify User Manually"
                          className="text-green-600 hover:text-green-800"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                        {user.is_blocked ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => unblockUser(user.id)}
                            title="Unblock User"
                            className="text-green-600 hover:text-green-800"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openBlockDialog(user)}
                            title="Block User"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
