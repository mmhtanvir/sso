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
import { PersonIcon, LockClosedIcon, EnvelopeClosedIcon } from '@radix-ui/react-icons';
import SocialLoginButton from '@/components/SocialLoginButton';
import { generateGoogleAuthUrl, generateFacebookAuthUrl } from '@/lib/social-auth';
import { extractAuthToken } from '@/lib/auth';

function RegisterContent() {
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
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const token = searchParams.get('token');
  const redirectUrl = searchParams.get('redirect_url');
  const socialToken = searchParams.get('social_token');
  const errorMessage = searchParams.get('error');

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
    }
  }, [errorMessage]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          token,
          redirectUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Redirect to client app with the JWT token
      const finalRedirectUrl = extractAuthToken(redirectUrl!, data.token);
      router.push(finalRedirectUrl);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
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

  if (error === 'Invalid client or redirect URL' || error === 'Missing required parameters') {
    return (
      <Container size="1" className="min-h-screen">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Card size="4">
            <Flex direction="column" gap="4" align="center">
              <Heading size="6" color="red">Error</Heading>
              <Text>{error}</Text>
            </Flex>
          </Card>
        </Flex>
      </Container>
    );
  }

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
              <Heading size="6" align="center">Create Account</Heading>
            </Flex>

            {error && (
              <Text color="red" size="2" align="center">
                {error}
              </Text>
            )}

            <Flex direction="column" gap="3">
              {clientInfo.googleClientId && (
                <SocialLoginButton
                  provider="google"
                  onClick={() => handleSocialLogin('google')}
                  disabled={isLoading}
                />
              )}
              {clientInfo.facebookAppId && (
                <SocialLoginButton
                  provider="facebook"
                  onClick={() => handleSocialLogin('facebook')}
                  disabled={isLoading}
                />
              )}
            </Flex>

            {clientInfo.googleClientId || clientInfo.facebookAppId && <Flex align="center" gap="3">
              <Separator size="4" />
              <Text size="2" color="gray">or</Text>
              <Separator size="4" />
            </Flex>}

            <form onSubmit={handleRegister}>
              <Flex direction="column" gap="4">
                <div>
                  <Text as="label" size="2" mb="2" weight="medium">
                    Full Name
                  </Text>
                  <TextField.Root
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  >
                    <TextField.Slot>
                      <PersonIcon height="16" width="16" />
                    </TextField.Slot>
                  </TextField.Root>
                </div>

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

                <div>
                  <Text as="label" size="2" mb="2" weight="medium">
                    Confirm Password
                  </Text>
                  <TextField.Root
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    required
                  >
                    <TextField.Slot>
                      <LockClosedIcon height="16" width="16" />
                    </TextField.Slot>
                  </TextField.Root>
                </div>

                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </Flex>
            </form>

            <Flex justify="center">
              <Text size="2">
                Already have an account?{' '}
                <Link
                  href={`/login?token=${token}&redirect_url=${encodeURIComponent(redirectUrl || '')}`}
                  className="text-blue-500 hover:text-blue-600"
                >
                  Sign in
                </Link>
              </Text>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <Container size="1" className="min-h-screen">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Text>Loading...</Text>
        </Flex>
      </Container>
    }>
      <RegisterContent />
    </Suspense>
  );
}
