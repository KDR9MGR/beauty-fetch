import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Search, Store, User, Clock, Reply, Archive, Flag } from "lucide-react";

interface MessageWithDetails {
  id: string;
  subject: string;
  content: string;
  status: string;
  priority: string;
  message_type: string;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  customer: {
    id: string;
    name: string;
    email: string;
  };
  store: {
    id: string;
    name: string;
  } | null;
  merchant: {
    id: string;
    name: string;
    email: string;
  } | null;
  replies: {
    id: string;
    content: string;
    created_at: string;
    sender_type: string;
    sender_name: string;
  }[];
}

export const AdminMessages = () => {
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<MessageWithDetails | null>(null);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [storeFilter, setStoreFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [replyContent, setReplyContent] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
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

  const fetchMessages = async () => {
    try {
      // Fetch customer messages
      const { data: customerMessages, error: customerError } = await supabase
        .from("customer_messages")
        .select(`
          *,
          profiles:customer_id (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (customerError) throw customerError;

      // Fetch merchant messages  
      const { data: merchantMessages, error: merchantError } = await supabase
        .from("merchant_messages")
        .select(`
          *,
          stores:store_id (
            id,
            name
          )
        `)
        .order("created_at", { ascending: false });

      if (merchantError) throw merchantError;

      // Combine and format messages
      const allMessages: MessageWithDetails[] = [
        ...(customerMessages?.map(msg => ({
          ...msg,
          customer: {
            id: msg.profiles?.id || '',
            name: `${msg.profiles?.first_name} ${msg.profiles?.last_name}`,
            email: msg.profiles?.email || ''
          },
          store: null,
          merchant: null,
          replies: [],
          message_type: 'customer'
        })) || []),
        ...(merchantMessages?.map(msg => ({
          ...msg,
          customer: {
            id: '',
            name: '',
            email: ''
          },
          store: msg.stores ? {
            id: msg.stores.id,
            name: msg.stores.name
          } : null,
          merchant: {
            id: msg.sender_id || '',
            name: 'Merchant User',
            email: 'merchant@example.com'
          },
          replies: [],
          message_type: 'merchant'
        })) || [])
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Fetch replies for each message
      const messagesWithReplies = await Promise.all(
        allMessages.map(async (message) => {
          const { data: replies } = await supabase
            .from("message_replies")
            .select(`
              *,
              profiles:sender_id (
                first_name,
                last_name
              )
            `)
            .eq("message_id", message.id)
            .order("created_at", { ascending: true });

          return {
            ...message,
            replies: replies?.map(reply => ({
              id: reply.id,
              content: reply.content,
              created_at: reply.created_at,
              sender_type: reply.sender_type,
              sender_name: reply.profiles ? 
                `${reply.profiles.first_name} ${reply.profiles.last_name}` : 
                reply.sender_type === 'admin' ? 'Admin' : 'Unknown'
            })) || []
          };
        })
      );

      setMessages(messagesWithReplies);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId: string, newStatus: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const table = message.message_type === 'customer' ? 'customer_messages' : 'merchant_messages';
      
      const { error } = await supabase
        .from(table)
        .update({ status: newStatus })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message status updated successfully",
      });
      fetchMessages();
    } catch (error) {
      console.error("Error updating message status:", error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const archiveMessage = async (messageId: string) => {
    try {
      const message = messages.find(m => m.id === messageId);
      if (!message) return;

      const table = message.message_type === 'customer' ? 'customer_messages' : 'merchant_messages';
      
      const { error } = await supabase
        .from(table)
        .update({ 
          is_archived: true,
          archived_at: new Date().toISOString()
        })
        .eq("id", messageId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message archived successfully",
      });
      fetchMessages();
    } catch (error) {
      console.error("Error archiving message:", error);
      toast({
        title: "Error",
        description: "Failed to archive message",
        variant: "destructive",
      });
    }
  };

  const sendReply = async () => {
    if (!selectedMessage || !replyContent.trim()) return;

    try {
      const { error } = await supabase
        .from("message_replies")
        .insert({
          message_id: selectedMessage.id,
          content: replyContent,
          sender_type: 'admin',
          sender_id: null // Admin user - you might want to get actual admin ID
        });

      if (error) throw error;

      // Update message status to 'replied'
      await updateMessageStatus(selectedMessage.id, 'replied');

      toast({
        title: "Success",
        description: "Reply sent successfully",
      });
      setReplyContent("");
      setReplyDialogOpen(false);
      fetchMessages();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast({
        title: "Error",
        description: "Failed to send reply",
        variant: "destructive",
      });
    }
  };

  const openMessageDialog = (message: MessageWithDetails) => {
    setSelectedMessage(message);
    setMessageDialogOpen(true);
  };

  const openReplyDialog = (message: MessageWithDetails) => {
    setSelectedMessage(message);
    setReplyDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "destructive";
      case "in_progress":
        return "secondary";
      case "replied":
        return "default";
      case "resolved":
        return "default";
      default:
        return "secondary";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "destructive";
      case "medium":
        return "secondary";
      case "low":
        return "default";
      default:
        return "secondary";
    }
  };

  const filterMessagesByTab = (messages: MessageWithDetails[]) => {
    switch (activeTab) {
      case "customer":
        return messages.filter(msg => msg.message_type === "customer");
      case "merchant":
        return messages.filter(msg => msg.message_type === "merchant");
      case "archived":
        return messages.filter(msg => msg.is_archived);
      case "urgent":
        return messages.filter(msg => msg.priority === "high" && !msg.is_archived);
      case "all":
      default:
        return messages.filter(msg => !msg.is_archived);
    }
  };

  const filteredMessages = filterMessagesByTab(messages).filter(message => {
    const matchesSearch = 
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.merchant?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.merchant?.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || message.status === statusFilter;
    const matchesStore = storeFilter === "all" || message.store?.id === storeFilter;
    const matchesType = typeFilter === "all" || message.message_type === typeFilter;

    return matchesSearch && matchesStatus && matchesStore && matchesType;
  });

  if (loading) {
    return <div>Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Message Management</h2>
          <p className="text-gray-600">Manage customer and merchant messages with store-based organization</p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="replied">Replied</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={storeFilter} onValueChange={setStoreFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Stores" />
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
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="customer">Customer Messages</SelectItem>
                <SelectItem value="merchant">Merchant Messages</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Message Details Dialog */}
      <Dialog open={messageDialogOpen} onOpenChange={setMessageDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>{selectedMessage?.subject}</span>
            </DialogTitle>
          </DialogHeader>
          
          {selectedMessage && (
            <div className="space-y-6">
              {/* Message Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Message Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge variant={getStatusColor(selectedMessage.status)}>
                        {selectedMessage.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Priority:</span>
                      <Badge variant={getPriorityColor(selectedMessage.priority)}>
                        {selectedMessage.priority}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Type:</span>
                      <Badge variant="outline">{selectedMessage.message_type}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Created:</span>
                      <span className="text-sm">{new Date(selectedMessage.created_at).toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Contact Info</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedMessage.message_type === 'customer' ? (
                      <>
                        <div>
                          <span className="text-sm font-medium">Customer:</span>
                          <p className="text-sm">{selectedMessage.customer.name}</p>
                          <p className="text-sm text-gray-500">{selectedMessage.customer.email}</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="text-sm font-medium">Merchant:</span>
                          <p className="text-sm">{selectedMessage.merchant?.name}</p>
                          <p className="text-sm text-gray-500">{selectedMessage.merchant?.email}</p>
                        </div>
                        {selectedMessage.store && (
                          <div>
                            <span className="text-sm font-medium">Store:</span>
                            <p className="text-sm">{selectedMessage.store.name}</p>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Message Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Message Content</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Replies */}
              {selectedMessage.replies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Replies ({selectedMessage.replies.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedMessage.replies.map((reply) => (
                        <div key={reply.id} className="border-l-4 border-blue-200 pl-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="font-medium">{reply.sender_name}</span>
                              <Badge variant="outline" className="ml-2 text-xs">
                                {reply.sender_type}
                              </Badge>
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(reply.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => openReplyDialog(selectedMessage)}
                >
                  <Reply className="h-4 w-4 mr-2" />
                  Reply
                </Button>
                <Select
                  value={selectedMessage.status}
                  onValueChange={(status) => updateMessageStatus(selectedMessage.id, status)}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => archiveMessage(selectedMessage.id)}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Message</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Subject: {selectedMessage?.subject}</label>
            </div>
            
            <div>
              <label className="text-sm font-medium">Reply Content</label>
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your reply here..."
                rows={6}
                className="mt-1"
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setReplyDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={sendReply} disabled={!replyContent.trim()}>
                Send Reply
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Messages Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Messages ({messages.filter(m => !m.is_archived).length})</TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Customer ({messages.filter(m => m.message_type === "customer" && !m.is_archived).length})
          </TabsTrigger>
          <TabsTrigger value="merchant" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            Merchant ({messages.filter(m => m.message_type === "merchant" && !m.is_archived).length})
          </TabsTrigger>
          <TabsTrigger value="urgent" className="flex items-center gap-2">
            <Flag className="h-4 w-4" />
            Urgent ({messages.filter(m => m.priority === "high" && !m.is_archived).length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            Archived ({messages.filter(m => m.is_archived).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === "all" && "All Messages"}
                {activeTab === "customer" && "Customer Messages"}
                {activeTab === "merchant" && "Merchant Messages"}
                {activeTab === "urgent" && "Urgent Messages"}
                {activeTab === "archived" && "Archived Messages"}
                {" "}({filteredMessages.length})
              </CardTitle>
              <CardDescription>
                {activeTab === "all" && "View and manage all messages"}
                {activeTab === "customer" && "Messages from customers"}
                {activeTab === "merchant" && "Messages from merchants and stores"}
                {activeTab === "urgent" && "High priority messages requiring immediate attention"}
                {activeTab === "archived" && "Archived messages"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>From</TableHead>
                    {activeTab === "merchant" && <TableHead>Store</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Replies</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {message.subject}
                      </TableCell>
                      <TableCell>
                        {message.message_type === 'customer' ? (
                          <div>
                            <p className="font-medium">{message.customer.name}</p>
                            <p className="text-sm text-gray-500">{message.customer.email}</p>
                          </div>
                        ) : (
                          <div>
                            <p className="font-medium">{message.merchant?.name}</p>
                            <p className="text-sm text-gray-500">{message.merchant?.email}</p>
                          </div>
                        )}
                      </TableCell>
                      {activeTab === "merchant" && (
                        <TableCell>
                          {message.store ? (
                            <Badge variant="outline">{message.store.name}</Badge>
                          ) : (
                            <span className="text-gray-400">No store</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <Badge variant={getStatusColor(message.status)}>
                          {message.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPriorityColor(message.priority)}>
                          {message.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {message.replies.length > 0 ? (
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-4 w-4" />
                            <span>{message.replies.length}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">No replies</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {new Date(message.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openMessageDialog(message)}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReplyDialog(message)}
                          >
                            <Reply className="h-4 w-4" />
                          </Button>
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