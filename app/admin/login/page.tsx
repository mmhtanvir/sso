'use client';

import { useState } from 'react';
import { Container, Heading, Text, Button, Flex, TextField, Card } from '@radix-ui/themes';
import { LockClosedIcon, PersonIcon } from '@radix-ui/react-icons';
import { useRouter } from 'next/navigation';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // TODO: Implement actual authentication logic here
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Invalid credentials');
      }

      // Redirect to admin dashboard on successful login
      router.push('/admin/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <Container size="1">
        <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh' }}>
          <Card size="4" style={{ width: '100%', maxWidth: 400 }}>
            <Flex direction="column" gap="5">
              <Flex direction="column" align="center" gap="3">
                <LockClosedIcon width="30" height="30" className="text-blue-500" />
                <Heading size="6" align="center">Admin Login</Heading>
                <Text size="2" color="gray" align="center">
                  Please sign in to access the admin dashboard
                </Text>
              </Flex>

              {error && (
                <Text color="red" size="2" align="center">
                  {error}
                </Text>
              )}

              <form onSubmit={handleLogin}>
                <Flex direction="column" gap="4">
                  <div>
                    <Text as="label" size="2" mb="2" weight="medium">
                      Email
                    </Text>
                    <TextField.Root 
                      type="email"
                      placeholder="admin@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    >
                      <TextField.Slot>
                        <PersonIcon height="16" width="16" />
                      </TextField.Slot>
                    </TextField.Root>
                  </div>

                  <div>
                    <Text as="label" size="2" mb="2" weight="medium">
                      Password
                    </Text>
                    <TextField.Root
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    >
                      <TextField.Slot>
                        <LockClosedIcon height="16" width="16" />
                      </TextField.Slot>
                    </TextField.Root>
                  </div>

                  <Button type="submit" size="3" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign in'}
                  </Button>
                </Flex>
              </form>
            </Flex>
          </Card>
        </Flex>
      </Container>
    </main>
  );
}
