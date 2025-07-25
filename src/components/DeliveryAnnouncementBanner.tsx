import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DeliveryAnnouncement = Tables<'delivery_announcements'>;

export const DeliveryAnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<DeliveryAnnouncement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveAnnouncements();
  }, []);

  useEffect(() => {
    if (announcements.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % announcements.length);
      }, 5000); // Change announcement every 5 seconds

      return () => clearInterval(interval);
    }
  }, [announcements.length]);

  const fetchActiveAnnouncements = async () => {
    try {
      const { data, error } = await supabase
        .from('delivery_announcements')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', new Date().toISOString())
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString()}`)
        .order('display_priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out dismissed announcements
      const storedDismissed = JSON.parse(localStorage.getItem('dismissedAnnouncements') || '[]');
      setDismissed(storedDismissed);
      
      const filteredAnnouncements = data?.filter(announcement => 
        !storedDismissed.includes(announcement.id)
      ) || [];
      
      setAnnouncements(filteredAnnouncements);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (announcementId: string) => {
    const newDismissed = [...dismissed, announcementId];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
    
    setAnnouncements(prev => prev.filter(a => a.id !== announcementId));
    
    // Reset index if we removed the current announcement
    if (currentIndex >= announcements.length - 1) {
      setCurrentIndex(0);
    }
  };

  const getAnnouncementTypeIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'promotion':
        return '🎉';
      case 'maintenance':
        return '🔧';
      default:
        return 'ℹ️';
    }
  };

  if (loading || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentIndex];

  return (
    <div 
      className="relative overflow-hidden"
      style={{
        backgroundColor: currentAnnouncement.background_color || '#8B5CF6',
        color: currentAnnouncement.text_color || '#FFFFFF'
      }}
    >
      <div className="animate-scroll whitespace-nowrap py-2 px-4">
        <div className="inline-flex items-center space-x-4 min-w-full">
          <span className="text-sm font-medium">
            {getAnnouncementTypeIcon(currentAnnouncement.type || 'info')}
          </span>
          <span className="text-sm font-medium">
            {currentAnnouncement.title}
          </span>
          <span className="text-sm opacity-90">
            {currentAnnouncement.message}
          </span>
          {announcements.length > 1 && (
            <span className="text-xs opacity-75 ml-8">
              ({currentIndex + 1}/{announcements.length})
            </span>
          )}
        </div>
      </div>
      
      <button
        onClick={() => handleDismiss(currentAnnouncement.id)}
        className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-black/10 transition-colors"
        aria-label="Dismiss announcement"
      >
        <X className="h-4 w-4" />
      </button>

      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes scroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          .animate-scroll {
            animation: scroll 20s linear infinite;
          }
          .animate-scroll:hover {
            animation-play-state: paused;
          }
        `
      }} />
    </div>
  );
}; 