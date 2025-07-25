import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { MessageCircle, Send, Plus } from 'lucide-react';

export const MerchantMessages = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState({ subject: '', message: '' });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMessages();
    }
  }, [user]);

  const fetchMessages = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('merchant_messages')
        .select(`
          *,
          sender:profiles!merchant_messages_sender_id_fkey(first_name, last_name, role),
          recipient:profiles!merchant_messages_recipient_id_fkey(first_name, last_name, role)
        `)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!user || !newMessage.subject.trim() || !newMessage.message.trim()) {
      toast.error('Please fill in both subject and message');
      return;
    }

    setSending(true);
    try {
      // Find admin users to send message to
      const { data: adminUsers, error: adminError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1);

      if (adminError) throw adminError;
      if (!adminUsers?.length) {
        toast.error('No admin found to send message to');
        return;
      }

      const { error } = await supabase
        .from('merchant_messages')
        .insert({
          sender_id: user.id,
          recipient_id: adminUsers[0].id,
          subject: newMessage.subject,
          message: newMessage.message,
          message_type: 'general',
          is_read: false,
        });

      if (error) throw error;

      toast.success('Message sent successfully');
      setNewMessage({ subject: '', message: '' });
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('merchant_messages')
        .update({ is_read: true })
        .eq('id', messageId)
        .eq('recipient_id', user?.id);

      if (error) throw error;
      fetchMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
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

  const unreadCount = messages.filter(m => m.recipient_id === user?.id && !m.is_read).length;

  return (
    <div className="space-y-6">
      {/* New Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Send Message to Admin
          </CardTitle>
          <CardDescription>
            Contact admin team for support or inquiries
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Input
              placeholder="Subject"
              value={newMessage.subject}
              onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
            />
          </div>
          <div>
            <Textarea
              placeholder="Your message..."
              rows={4}
              value={newMessage.message}
              onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
            />
          </div>
          <Button onClick={sendMessage} disabled={sending}>
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Send Message
          </Button>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Messages
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} unread
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            Communication history with admin team
          </CardDescription>
        </CardHeader>
        <CardContent>
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No messages</h3>
              <p className="text-gray-600">Start a conversation with the admin team</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => {
                const isFromMe = message.sender_id === user?.id;
                const isUnread = message.recipient_id === user?.id && !message.is_read;
                
                return (
                  <Card 
                    key={message.id} 
                    className={`${isUnread ? 'border-beauty-purple bg-purple-50' : ''}`}
                    onClick={() => {
                      if (isUnread) {
                        markAsRead(message.id);
                      }
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{message.subject}</h4>
                          {isUnread && (
                            <Badge variant="destructive" className="text-xs">New</Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(message.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium">
                          {isFromMe ? 'You' : 'Admin'}
                        </span>
                        <Badge variant={isFromMe ? 'secondary' : 'default'} className="text-xs">
                          {isFromMe ? 'Sent' : 'Received'}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 text-sm">{message.message}</p>
                      
                      {message.message_type !== 'general' && (
                        <Badge variant="outline" className="mt-2">
                          {message.message_type.replace('_', ' ')}
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}; 