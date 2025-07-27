import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Eye, EyeOff, Truck } from 'lucide-react';

const DriverAuth = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        // Redirect based on role
        if (profile?.role === 'driver') {
          navigate('/driver');
        } else {
          navigate('/');
        }
      }
    };

    checkUser();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // 1. Sign in
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (authError) throw authError;

      // 2. Check application status
      const { data: application, error: applicationError } = await supabase
        .from('driver_applications')
        .select('status')
        .eq('email', email)
        .single();

      if (applicationError && applicationError.code !== 'PGRST116') {
        throw applicationError;
      }

      if (!application) {
        // No application found
        toast.error("No driver application found for this email. Please apply first.");
        await supabase.auth.signOut();
        navigate('/driver-signup');
        return;
      }

      setApplicationStatus(application.status);

      switch (application.status) {
        case 'pending':
          toast.info("Your application is pending review. We'll notify you once it's approved.");
          await supabase.auth.signOut();
          break;

        case 'in_review':
          toast.info("Your application is currently being reviewed. We'll notify you soon.");
          await supabase.auth.signOut();
          break;

        case 'needs_info':
          toast.warning("We need additional information for your application. Please check your email.");
          await supabase.auth.signOut();
          break;

        case 'rejected':
          toast.error("Your application has been rejected. Please check your email for details.");
          await supabase.auth.signOut();
          break;

        case 'approved':
          // Check if driver profile exists
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', authData.user!.id)
            .single();

          if (profile?.role !== 'driver') {
            // Update profile role to driver
            await supabase
              .from('profiles')
              .update({ role: 'driver' })
              .eq('id', authData.user!.id);
          }

          // Create driver status if it doesn't exist
          // Note: driver_status table doesn't exist in schema
          console.log('Driver logged in successfully');

          toast.success("Welcome back! You're now logged in.");
          navigate('/driver');
          break;

        default:
          toast.error("An error occurred with your application status.");
          await supabase.auth.signOut();
          break;
      }

    } catch (error: any) {
      console.error('Error during login:', error);
      toast.error(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Button
        variant="ghost"
        className="mb-8"
        onClick={() => navigate('/')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>

      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Truck className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Driver Sign In
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to your driver account
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>
              Enter your email and password to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center space-y-2">
                <p className="text-sm text-gray-600">
                  Don't have an account?{' '}
                  <Link to="/driver-signup" className="text-blue-600 hover:underline">
                    Apply to be a driver
                  </Link>
                </p>
                <p className="text-sm text-gray-600">
                  <Link to="/forgot-password" className="text-blue-600 hover:underline">
                    Forgot your password?
                  </Link>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DriverAuth; 