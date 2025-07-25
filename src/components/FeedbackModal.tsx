import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Heart, ThumbsUp, Package, Truck } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  driverName?: string;
  storeName?: string;
}

export const FeedbackModal = ({ isOpen, onClose, orderNumber, driverName, storeName }: FeedbackModalProps) => {
  const [overallRating, setOverallRating] = useState(0);
  const [driverRating, setDriverRating] = useState(0);
  const [storeRating, setStoreRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [additionalTip, setAdditionalTip] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarClick = (rating: number, type: 'overall' | 'driver' | 'store') => {
    switch (type) {
      case 'overall':
        setOverallRating(rating);
        break;
      case 'driver':
        setDriverRating(rating);
        break;
      case 'store':
        setStoreRating(rating);
        break;
    }
  };

  const renderStars = (currentRating: number, onStarClick: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onStarClick(star)}
            className="transition-colors hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                star <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 hover:text-yellow-400'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (overallRating === 0) {
      toast.error('Please provide an overall rating');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call to save feedback
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In real implementation, this would save to the database
      const feedbackData = {
        orderNumber,
        overallRating,
        driverRating,
        storeRating,
        feedback,
        additionalTip,
        timestamp: new Date().toISOString()
      };
      
      console.log('Feedback submitted:', feedbackData);
      
      toast.success('Thank you for your feedback!');
      onClose();
      
      // Reset form
      setOverallRating(0);
      setDriverRating(0);
      setStoreRating(0);
      setFeedback('');
      setAdditionalTip(0);
    } catch (error) {
      toast.error('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            How was your experience?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Order Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="font-medium">Order #{orderNumber}</p>
            <p className="text-sm text-gray-600">Your feedback helps us improve our service</p>
          </div>

          {/* Overall Rating */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-medium">Overall Experience</Label>
                  <p className="text-sm text-gray-600">How would you rate your overall experience?</p>
                </div>
                {renderStars(overallRating, (rating) => handleStarClick(rating, 'overall'))}
              </div>
            </CardContent>
          </Card>

          {/* Driver Rating */}
          {driverName && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Truck className="h-5 w-5 text-blue-600" />
                    <div>
                      <Label className="text-base font-medium">Delivery Service</Label>
                      <p className="text-sm text-gray-600">Rate your driver: {driverName}</p>
                    </div>
                  </div>
                  {renderStars(driverRating, (rating) => handleStarClick(rating, 'driver'))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Store Rating */}
          {storeName && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-green-600" />
                    <div>
                      <Label className="text-base font-medium">Product Quality</Label>
                      <p className="text-sm text-gray-600">Rate the store: {storeName}</p>
                    </div>
                  </div>
                  {renderStars(storeRating, (rating) => handleStarClick(rating, 'store'))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Written Feedback */}
          <div>
            <Label htmlFor="feedback" className="text-base font-medium">
              Additional Comments (Optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Tell us more about your experience..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>

          {/* Additional Tip */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  <Label className="text-base font-medium">Add an Additional Tip (Optional)</Label>
                </div>
                <p className="text-sm text-gray-600">
                  Show your appreciation for excellent service
                </p>
                <div className="flex gap-2">
                  {[2, 5, 10, 15].map((amount) => (
                    <Button
                      key={amount}
                      variant={additionalTip === amount ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAdditionalTip(amount)}
                    >
                      ${amount}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2 items-center">
                  <Input
                    type="number"
                    placeholder="Custom amount"
                    step="0.01"
                    min="0"
                    value={additionalTip || ''}
                    onChange={(e) => setAdditionalTip(parseFloat(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalTip(0)}
                  >
                    No Tip
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Feedback Options */}
          <div>
            <Label className="text-base font-medium mb-3 block">Quick Feedback</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                'Fast delivery',
                'Great packaging',
                'Friendly driver',
                'Quality products',
                'Easy ordering',
                'Good communication'
              ].map((option) => (
                <Button
                  key={option}
                  variant="outline"
                  size="sm"
                  className="justify-start"
                  onClick={() => {
                    if (feedback.includes(option)) {
                      setFeedback(feedback.replace(option, '').trim());
                    } else {
                      setFeedback(feedback ? `${feedback}, ${option}` : option);
                    }
                  }}
                >
                  <ThumbsUp className="h-4 w-4 mr-2" />
                  {option}
                </Button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || overallRating === 0}
              className="flex-1"
            >
              {isSubmitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : null}
              Submit Feedback
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 