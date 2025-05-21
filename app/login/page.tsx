'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Heading,
  Text,
  Button,
  Card,
  Flex,
  TextField,
  Separator,
} from '@radix-ui/themes';
import { LockClosedIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';
import SocialLoginButton from '@/components/SocialLoginButton';
import { generateGoogleAuthUrl, generateFacebookAuthUrl } from '@/lib/social-auth';
import { extractAuthToken } from '@/lib/auth';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [clientInfo, setClientInfo] = useState<{ 
    name?: string; 
    logoUrl?: string | null; 
    googleClientId?: string | null; 
    googleClientSecret?: string | null; 
    facebookAppId?: string | null; 
    facebookAppSecret?: string | null; 
  }>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const token = searchParams.get('token');
  const redirectUrl = searchParams.get('redirect_url');
  const socialToken = searchParams.get('social_token');
  const errorMessage = searchParams.get('error');
  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    if (token) {
      fetchClientInfo();
    }
  }, [token, redirectUrl]);

  const fetchClientInfo = async () => {
    if (!token) return;
    
    try {
      const response = await fetch(`/api/auth/client-info?token=${token}`);
      if (response.ok) {
        const data = await response.json();
        setClientInfo(data);
      }
    } catch (error) {
      console.error('Error fetching client info:', error);
    }
  };

  useEffect(() => {
    // Handle social login token
    if (socialToken) {
      // Redirect to client app with the JWT token
      const finalRedirectUrl = extractAuthToken(redirectUrl!, socialToken);
      router.push(finalRedirectUrl);
    }
  }, [socialToken, redirectUrl]);

  useEffect(() => {
    // Set error message if present
    if (errorMessage) {
      setError(decodeURIComponent(errorMessage));
    } else if (cancelled) {
      setError('Login cancelled');
    }
  }, [errorMessage, cancelled]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          token,
          redirectUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Redirect to client app with the JWT token
      const finalRedirectUrl = extractAuthToken(redirectUrl!, data.token);
      router.push(finalRedirectUrl);
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    // Create state parameter with client token and redirect URL
    const stateData = {
      clientToken: token,
      redirectUrl: redirectUrl,
    };
    const state = Buffer.from(JSON.stringify(stateData)).toString('base64');

    // Generate OAuth URL based on provider using client-specific credentials if available
    let authUrl;
    if (provider === 'google') {
      authUrl = generateGoogleAuthUrl(state, clientInfo.googleClientId);
    } else {
      authUrl = generateFacebookAuthUrl(state, clientInfo.facebookAppId);
    }

    // If no auth URL could be generated (no credentials available), show error
    if (!authUrl) {
      setError(`${provider.charAt(0).toUpperCase() + provider.slice(1)} login is not configured for this client`);
      return;
    }

    // Redirect to OAuth provider
    window.location.href = authUrl;
  };

  return (
    <Container size="1" className="min-h-screen">
      <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Card size="4" style={{ width: '100%', maxWidth: 400, backgroundColor: '#C9D4E5' }}>
          <Flex direction="column" gap="5">
            <Flex direction="column" align="center" gap="3">
              {clientInfo.logoUrl && (
                <img 
                  alt={clientInfo.name ? `${clientInfo.name} logo` : 'Application logo'}
                  src={clientInfo.logoUrl}
                  style={{ marginBottom: '10px', maxWidth: '120px', height: 'auto' }}
                />
              )}
              {clientInfo.name && (
                <Text size="2" color="gray" align="center">
                  {clientInfo.name}
                </Text>
              )}
              <Heading size="4" align="center">Sign in to your account</Heading>
            </Flex>

            {error && (
              <Card style={{ backgroundColor: '#FEE2E2', padding: '8px', border: '1px solid #FCA5A5' }}>
                <Text color="red" size="2" align="center">
                  {error}
                </Text>
              </Card>
            )}

            <Flex direction="column" gap="3">
              {(clientInfo.facebookAppId) && <SocialLoginButton
                provider="facebook"
                onClick={() => handleSocialLogin('facebook')}
                disabled={isLoading}
              />}
              {(clientInfo.googleClientId) && <SocialLoginButton
                provider="google"
                onClick={() => handleSocialLogin('google')}
                disabled={isLoading}
              />}
            </Flex>

            {(clientInfo.facebookAppId || clientInfo.googleClientId) && <Flex align="center" gap="3">
              <Separator size="4" />
              <Text size="2" color="gray">or</Text>
              <Separator size="4" />
            </Flex>}

            <form onSubmit={handleLogin}>
              <Flex direction="column" gap="4">
                <div>
                  <Text as="label" size="2" mb="2" weight="medium">
                    Email
                  </Text>
                  <TextField.Root
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  >
                    <TextField.Slot>
                      <EnvelopeClosedIcon height="16" width="16" />
                    </TextField.Slot>
                  </TextField.Root>
                </div>

                <div>
                  <Text as="label" size="2" mb="2" weight="medium">
                    Password
                  </Text>
                  <TextField.Root
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                  >
                    <TextField.Slot>
                      <LockClosedIcon height="16" width="16" />
                    </TextField.Slot>
                  </TextField.Root>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </Button>
              </Flex>
            </form>

            <Flex justify="center">
              <Text size="2">
                Don't have an account?{' '}
                <Link
                  href={`/register?token=${token}&redirect_url=${encodeURIComponent(redirectUrl || '')}`}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Sign up
                </Link>
              </Text>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Container size="1" className="min-h-screen">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Text>Loading...</Text>
        </Flex>
      </Container>
    }>
      <LoginContent />
    </Suspense>
  );
}
