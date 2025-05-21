'use client';

import { Container, Heading, Text, Button, Flex, Card, Box, Section } from '@radix-ui/themes';
import { RocketIcon, LockClosedIcon, PersonIcon, GitHubLogoIcon } from '@radix-ui/react-icons';

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Section size="3" className="bg-gradient-to-b from-blue-50 to-white">
        <Container size="4">
          <Flex direction="column" align="center" gap="4" className="py-20 text-center">
            <Heading size="9" className="tracking-tight">
              Welcome to Next SSO
            </Heading>
            <Text size="5" color="gray" className="max-w-[600px]">
              A secure and modern authentication solution built with Next.js and industry-standard protocols.
            </Text>
            <Flex gap="4" mt="6">
              <Button size="4" variant="solid">
                Get Started
              </Button>
              <Button size="4" variant="soft">
                Learn More
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Section>

      {/* Features Section */}
      <Section size="3">
        <Container size="4">
          <Flex direction="column" gap="8" className="py-16">
            <Heading size="6" align="center" mb="6">
              Key Features
            </Heading>
            <Flex gap="6" wrap="wrap" justify="center">
              <Card size="3" style={{ width: 300 }}>
                <Flex gap="3" align="center" mb="4">
                  <Box className="p-2 bg-blue-100 rounded-lg">
                    <LockClosedIcon width="24" height="24" className="text-blue-500" />
                  </Box>
                  <Heading size="4">Secure Authentication</Heading>
                </Flex>
                <Text as="p" color="gray">
                  Enterprise-grade security with modern authentication protocols and best practices.
                </Text>
              </Card>

              <Card size="3" style={{ width: 300 }}>
                <Flex gap="3" align="center" mb="4">
                  <Box className="p-2 bg-green-100 rounded-lg">
                    <RocketIcon width="24" height="24" className="text-green-500" />
                  </Box>
                  <Heading size="4">Quick Setup</Heading>
                </Flex>
                <Text as="p" color="gray">
                  Get up and running in minutes with our streamlined configuration process.
                </Text>
              </Card>

              <Card size="3" style={{ width: 300 }}>
                <Flex gap="3" align="center" mb="4">
                  <Box className="p-2 bg-purple-100 rounded-lg">
                    <PersonIcon width="24" height="24" className="text-purple-500" />
                  </Box>
                  <Heading size="4">User Management</Heading>
                </Flex>
                <Text as="p" color="gray">
                  Comprehensive user management with roles, permissions, and detailed analytics.
                </Text>
              </Card>
            </Flex>
          </Flex>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section size="3" className="bg-slate-50">
        <Container size="4">
          <Flex direction="column" align="center" gap="4" className="py-16 text-center">
            <Heading size="6">Ready to Get Started?</Heading>
            <Text size="4" color="gray" className="max-w-[500px]">
              Join thousands of developers who trust Next SSO for their authentication needs.
            </Text>
            <Flex gap="4" mt="4">
              <Button size="3">
                <GitHubLogoIcon width="16" height="16" />
                View on GitHub
              </Button>
              <Button size="3" variant="soft">
                Documentation
              </Button>
            </Flex>
          </Flex>
        </Container>
      </Section>
    </main>
  );
}
