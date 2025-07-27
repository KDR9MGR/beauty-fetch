
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, Search, Archive, AlertTriangle, XCircle, DollarSign, TrendingUp, Store } from "lucide-react";

type OrderStatus = "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

interface OrderWithDetails {
  id: string;
  order_number: string;
  total_amount: number;
  status: OrderStatus;
  fraud_risk_level: string;
  is_archived: boolean;
  created_at: string;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
  order_items: {
    id: string;
    quantity: number;
    price: number;
    total: number;
    stores: { id: string; name: string };
    products: { id: string; name: string };
  }[];
  cost_breakdown?: {
    item_cost: number;
    store_commission: number;
    platform_fee: number;
    payment_processing_fee: number;
    delivery_cost: number;
    gross_profit: number;
    net_profit: number;
  };
}

export const AdminOrders = () => {
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [costDialogOpen, setCostDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const { data, error } = await supabase
      .from("stores")
      .select("id, name")
      .eq("status", "active")
      .order("name");

    if (!error) {
      setStores(data || []);
    }
  };

  const fetchOrders = async () => {
    try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        profiles:customer_id (
          first_name,
          last_name,
          email
          ),
          order_items (
            id,
            quantity,
            price,
            total,
            stores (id, name),
            products (id, name)
        )
      `)
      .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch cost breakdown for each order
      const ordersWithCostBreakdown = await Promise.all(
        (data || []).map(async (order) => {
          const { data: costData } = await supabase
            .from("order_cost_breakdown")
            .select("*")
            .eq("order_id", order.id)
            .single();

          return {
            ...order,
            cost_breakdown: costData || null
          };
        })
      );

      setOrders(ordersWithCostBreakdown as any);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

      if (error) throw error;

      // Log status change
      await supabase
        .from("order_status_history")
        .insert({
          order_id: orderId,
          old_status: orders.find(o => o.id === orderId)?.status,
          new_status: newStatus,
          change_reason: "Admin manual update",
          automated: false
        });

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
      fetchOrders();
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const archiveOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ 
          is_archived: true,
          archived_at: new Date().toISOString()
        })
        .eq("id", orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order archived successfully",
      });
      fetchOrders();
    } catch (error) {
      console.error("Error archiving order:", error);
      toast({
        title: "Error",
        description: "Failed to archive order",
        variant: "destructive",
      });
    }
  };

  const generateCostBreakdown = async (order: OrderWithDetails) => {
    try {
      // Calculate cost breakdown
      const itemCost = order.order_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const platformFeeRate = 0.03; // 3% platform fee
      const platformFee = order.total_amount * platformFeeRate;
      const deliveryCost = 5.99; // Fixed delivery cost
      const storeCommissionRate = 0.05; // 5% store commission
      const storeCommission = itemCost * storeCommissionRate;
      const paymentProcessingFee = order.total_amount * 0.029; // 2.9% payment processing
      
      const grossProfit = order.total_amount - itemCost - deliveryCost;
      const netProfit = grossProfit - platformFee - storeCommission - paymentProcessingFee;

      const costBreakdownData = {
        order_id: order.id,
        item_cost: itemCost,
        store_commission: storeCommission,
        platform_fee: platformFee,
        payment_processing_fee: paymentProcessingFee,
        delivery_cost: deliveryCost,
        gross_profit: grossProfit,
        net_profit: netProfit,
        cost_breakdown: {
          itemCost,
          storeCommission,
          platformFee,
          paymentProcessingFee,
          deliveryCost,
          grossProfit,
          netProfit,
          customerPaid: order.total_amount
        }
      };

      const { error } = await supabase
        .from("order_cost_breakdown")
        .upsert(costBreakdownData);

      if (error) throw error;

      // Update the order in our state
      setOrders(prev => prev.map(o => 
        o.id === order.id 
          ? { ...o, cost_breakdown: costBreakdownData }
          : o
      ));

      toast({
        title: "Success",
        description: "Cost breakdown generated successfully",
      });
    } catch (error) {
      console.error("Error generating cost breakdown:", error);
      toast({
        title: "Error",
        description: "Failed to generate cost breakdown",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "confirmed":
        return "default";
      case "processing":
        return "default";
      case "shipped":
        return "default";
      case "delivered":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return "default";
      case "medium":
        return "secondary";
      case "high":
        return "destructive";
      case "critical":
        return "destructive";
      default:
        return "default";
    }
  };

  const filterOrdersByTab = (orders: OrderWithDetails[]) => {
    switch (activeTab) {
      case "cancelled":
        return orders.filter(order => order.status === "cancelled");
      case "archived":
        return orders.filter(order => order.is_archived);
      case "fraud":
        return orders.filter(order => order.fraud_risk_level && order.fraud_risk_level !== "low");
      case "all":
      default:
        return orders.filter(order => !order.is_archived);
    }
  };

  const filteredOrders = filterOrdersByTab(orders).filter(order => {
    const matchesSearch = order.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.profiles?.last_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStore = selectedStore === "all" || 
                        order.order_items.some(item => item.stores.id === selectedStore);
    
    return matchesSearch && matchesStore;
  });

  const openCostDialog = async (order: OrderWithDetails) => {
    setSelectedOrder(order);
    if (!order.cost_breakdown) {
      await generateCostBreakdown(order);
    }
    setCostDialogOpen(true);
  };

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Orders Management</h2>
          <p className="text-gray-600">Manage customer orders with detailed cost analysis</p>
        </div>
      </div>

      {/* Filters */}
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
                  placeholder="Search by order number, customer name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedStore} onValueChange={setSelectedStore}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stores</SelectItem>
                {stores.map((store) => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cost Breakdown Dialog */}
      <Dialog open={costDialogOpen} onOpenChange={setCostDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Cost Breakdown - Order #{selectedOrder?.order_number}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder?.cost_breakdown && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Customer Paid</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      ${selectedOrder.total_amount.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Gross Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      ${selectedOrder.cost_breakdown.gross_profit.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Net Profit</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${selectedOrder.cost_breakdown.net_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${selectedOrder.cost_breakdown.net_profit.toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Breakdown */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Detailed Cost Breakdown</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Percentage</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Item Cost</TableCell>
                      <TableCell>${selectedOrder.cost_breakdown.item_cost.toFixed(2)}</TableCell>
                      <TableCell>{((selectedOrder.cost_breakdown.item_cost / selectedOrder.total_amount) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Store Commission (5%)</TableCell>
                      <TableCell>${selectedOrder.cost_breakdown.store_commission.toFixed(2)}</TableCell>
                      <TableCell>{((selectedOrder.cost_breakdown.store_commission / selectedOrder.total_amount) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Platform Fee (3%)</TableCell>
                      <TableCell>${selectedOrder.cost_breakdown.platform_fee.toFixed(2)}</TableCell>
                      <TableCell>{((selectedOrder.cost_breakdown.platform_fee / selectedOrder.total_amount) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Payment Processing (2.9%)</TableCell>
                      <TableCell>${selectedOrder.cost_breakdown.payment_processing_fee.toFixed(2)}</TableCell>
                      <TableCell>{((selectedOrder.cost_breakdown.payment_processing_fee / selectedOrder.total_amount) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Delivery Cost</TableCell>
                      <TableCell>${selectedOrder.cost_breakdown.delivery_cost.toFixed(2)}</TableCell>
                      <TableCell>{((selectedOrder.cost_breakdown.delivery_cost / selectedOrder.total_amount) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                    <TableRow className="border-t-2">
                      <TableCell className="font-bold">Net Profit</TableCell>
                      <TableCell className="font-bold">${selectedOrder.cost_breakdown.net_profit.toFixed(2)}</TableCell>
                      <TableCell className="font-bold">{((selectedOrder.cost_breakdown.net_profit / selectedOrder.total_amount) * 100).toFixed(1)}%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Store</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.order_items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.products.name}</TableCell>
                        <TableCell>{item.stores.name}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>${item.total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Orders ({orders.filter(o => !o.is_archived).length})</TabsTrigger>
          <TabsTrigger value="cancelled" className="flex items-center gap-2">
            <XCircle className="h-4 w-4" />
            Cancelled ({orders.filter(o => o.status === "cancelled").length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({orders.filter(o => o.is_archived).length})
          </TabsTrigger>
          <TabsTrigger value="fraud" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Fraud Risk ({orders.filter(o => o.fraud_risk_level && o.fraud_risk_level !== "low").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && "All Orders"}
                {activeTab === "cancelled" && "Cancelled Orders"}
                {activeTab === "archived" && "Archived Orders"}
                {activeTab === "fraud" && "Fraud Risk Orders"}
                {" "}({filteredOrders.length})
              </CardTitle>
              <CardDescription>
                {activeTab === "all" && "View and manage all customer orders"}
                {activeTab === "cancelled" && "Orders that have been cancelled"}
                {activeTab === "archived" && "Archived orders for record keeping"}
                {activeTab === "fraud" && "Orders flagged for potential fraud"}
              </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                    <TableHead>Stores</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                    {activeTab === "fraud" && <TableHead>Risk Level</TableHead>}
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.order_number}</TableCell>
                  <TableCell>
                    {order.profiles?.first_name} {order.profiles?.last_name}
                    <br />
                    <span className="text-sm text-gray-500">{order.profiles?.email}</span>
                  </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Array.from(new Set(order.order_items.map(item => item.stores.name))).map((storeName) => (
                            <Badge key={storeName} variant="outline" className="mr-1">
                              {storeName}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>${order.total_amount.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                          {activeTab !== "archived" && activeTab !== "cancelled" && (
                      <Select
                        value={order.status}
                        onValueChange={(newStatus: OrderStatus) => updateOrderStatus(order.id, newStatus)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                          )}
                    </div>
                  </TableCell>
                      {activeTab === "fraud" && (
                        <TableCell>
                          <Badge variant={getRiskBadgeColor(order.fraud_risk_level)}>
                            {order.fraud_risk_level || "low"}
                          </Badge>
                        </TableCell>
                      )}
                  <TableCell>
                    {new Date(order.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openCostDialog(order)}
                          >
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Cost
                          </Button>
                          {activeTab !== "archived" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => archiveOrder(order.id)}
                            >
                              <Archive className="h-4 w-4" />
                    </Button>
                          )}
                        </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
