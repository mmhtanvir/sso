'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Container,
  Heading,
  Text,
  Button,
  Card,
  Flex,
  Box,
} from '@radix-ui/themes';
import { ExclamationTriangleIcon, ArrowLeftIcon } from '@radix-ui/react-icons';

// Component that uses useSearchParams must be wrapped in Suspense
function ErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');

  useEffect(() => {
    const message = searchParams.get('message');
    const code = searchParams.get('code');

    if (message) {
      setErrorMessage(decodeURIComponent(message));
    } else {
      setErrorMessage('An unknown error occurred');
    }

    if (code) {
      setErrorCode(code);
    }
  }, [searchParams]);

  const getErrorTitle = () => {
    switch (errorCode) {
      case '400':
        return 'Bad Request';
      case '401':
        return 'Unauthorized';
      case '403':
        return 'Forbidden';
      case '404':
        return 'Not Found';
      default:
        return 'Error';
    }
  };

  const getErrorDescription = () => {
    switch (errorCode) {
      case '400':
        return 'The request could not be processed due to invalid parameters.';
      case '401':
        return 'Authentication is required to access this resource.';
      case '403':
        return 'You do not have permission to access this resource.';
      case '404':
        return 'The requested resource could not be found.';
      default:
        return 'Something went wrong. Please try again later. Unexpected Error code: ' + errorCode;
    }
  };

  return (
    <Container size="1" className="min-h-screen">
      <Flex direction="column" align="center" justify="center" style={{ minHeight: '100vh' }}>
        <Card size="4" style={{ width: '100%', maxWidth: 500, backgroundColor: '#F9FAFB' }}>
          <Flex direction="column" gap="5">
            <Flex direction="column" align="center" gap="3">
              <Box style={{ color: '#EF4444', fontSize: '48px' }}>
                <ExclamationTriangleIcon width="48" height="48" />
              </Box>
              <Heading size="6" align="center" style={{ color: '#EF4444' }}>
                {getErrorTitle()}
              </Heading>
              
              <Card>
                <Text align="center" style={{ color: '#EF4444' }}>
                  {errorMessage}
                </Text>
              </Card>
              
              <Text>
                {getErrorDescription()}
              </Text>
            </Flex>
          </Flex>
        </Card>
      </Flex>
    </Container>
  );
}

// Main component that wraps ErrorContent in Suspense
export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
