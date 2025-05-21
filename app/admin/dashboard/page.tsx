'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Heading,
  Button,
  Table,
  Dialog,
  Flex,
  TextField,
  Text,
  ScrollArea,
  Card,
  AlertDialog,
  Badge,
} from '@radix-ui/themes';
import { PlusIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons';

interface Client {
  _id: string;
  name: string;
  allowedOrigins: string[];
  redirectUrls: string[];
  logoUrl?: string;
  token: string;
  googleClientId?: string;
  googleClientSecret?: string;
  facebookAppId?: string;
  facebookAppSecret?: string;
  createdAt: string;
}

export default function AdminDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newClient, setNewClient] = useState({
    name: '',
    allowedOrigins: '',
    redirectUrls: '',
    logoUrl: '',
    googleClientId: '',
    googleClientSecret: '',
    facebookAppId: '',
    facebookAppSecret: '',
  });
  const [editClient, setEditClient] = useState({
    name: '',
    allowedOrigins: '',
    redirectUrls: '',
    logoUrl: '',
    googleClientId: '',
    googleClientSecret: '',
    facebookAppId: '',
    facebookAppSecret: '',
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients');
      }
      const data = await response.json();
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newClient.name,
          allowedOrigins: newClient.allowedOrigins.split(',').map(url => url.trim()),
          redirectUrls: newClient.redirectUrls.split(',').map(url => url.trim()),
          logoUrl: newClient.logoUrl,
          googleClientId: newClient.googleClientId,
          googleClientSecret: newClient.googleClientSecret,
          facebookAppId: newClient.facebookAppId,
          facebookAppSecret: newClient.facebookAppSecret,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create client');
      }

      setIsCreateDialogOpen(false);
      setNewClient({
        name: '',
        allowedOrigins: '',
        redirectUrls: '',
        logoUrl: '',
        googleClientId: '',
        googleClientSecret: '',
        facebookAppId: '',
        facebookAppSecret: '',
      });
      await fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
      setError('Failed to create client');
    }
  };

  const handleEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;

    try {
      const response = await fetch(`/api/admin/clients/${selectedClient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editClient.name,
          allowedOrigins: editClient.allowedOrigins.split(',').map(url => url.trim()),
          redirectUrls: editClient.redirectUrls.split(',').map(url => url.trim()),
          logoUrl: editClient.logoUrl,
          googleClientId: editClient.googleClientId,
          googleClientSecret: editClient.googleClientSecret,
          facebookAppId: editClient.facebookAppId,
          facebookAppSecret: editClient.facebookAppSecret,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update client');
      }

      setIsEditDialogOpen(false);
      setSelectedClient(null);
      setEditClient({
        name: '',
        allowedOrigins: '',
        redirectUrls: '',
        logoUrl: '',
        googleClientId: '',
        googleClientSecret: '',
        facebookAppId: '',
        facebookAppSecret: '',
      });
      await fetchClients();
    } catch (error) {
      console.error('Error updating client:', error);
      setError('Failed to update client');
    }
  };

  const handleDeleteClient = async () => {
    if (!selectedClient) return;

    try {
      const response = await fetch(`/api/admin/clients/${selectedClient._id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete client');
      }

      setIsDeleteDialogOpen(false);
      setSelectedClient(null);
      await fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Failed to delete client');
    }
  };

  const openEditDialog = (client: Client) => {
    setSelectedClient(client);
    setEditClient({
      name: client.name,
      allowedOrigins: client.allowedOrigins.join(', '),
      redirectUrls: client.redirectUrls.join(', '),
      logoUrl: client.logoUrl || '',
      googleClientId: client.googleClientId || '',
      googleClientSecret: client.googleClientSecret || '',
      facebookAppId: client.facebookAppId || '',
      facebookAppSecret: client.facebookAppSecret || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (client: Client) => {
    setSelectedClient(client);
    setIsDeleteDialogOpen(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-8">
      <Container size="4">
        <Card size="4">
          <Flex direction="column" gap="6">
            <Flex justify="between" align="center">
              <Heading size="6">Client Management</Heading>
              <Dialog.Root open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <Dialog.Trigger>
                  <Button size="3">
                    <PlusIcon width="16" height="16" />
                    New Client
                  </Button>
                </Dialog.Trigger>

                <Dialog.Content style={{ maxWidth: 560 }}>
                  <Dialog.Title>Create New Client</Dialog.Title>
                  <Dialog.Description size="2" mb="4">
                    Add a new client application to your SSO system.
                  </Dialog.Description>

                  <form onSubmit={handleCreateClient}>
                    <Flex direction="column" gap="4">
                      <div>
                        <Text as="label" size="2" mb="2" weight="medium">
                          Client Name
                        </Text>
                        <TextField.Root
                          placeholder="My Application"
                          value={newClient.name}
                          onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Text as="label" size="2" mb="2" weight="medium">
                          Allowed Origins
                        </Text>
                        <TextField.Root
                          placeholder="https://app1.com, https://app2.com"
                          value={newClient.allowedOrigins}
                          onChange={(e) => setNewClient({ ...newClient, allowedOrigins: e.target.value })}
                          required
                        />
                        <Text size="1" color="gray">
                          Comma-separated list of allowed origins
                        </Text>
                      </div>

                      <div>
                        <Text as="label" size="2" mb="2" weight="medium">
                          Redirect URLs
                        </Text>
                        <TextField.Root
                          placeholder="https://app1.com/callback, https://app2.com/callback"
                          value={newClient.redirectUrls}
                          onChange={(e) => setNewClient({ ...newClient, redirectUrls: e.target.value })}
                          required
                        />
                        <Text size="1" color="gray">
                          Comma-separated list of redirect URLs
                        </Text>
                      </div>

                      <div>
                        <Text as="label" size="2" mb="2" weight="medium">
                          Logo URL
                        </Text>
                        <TextField.Root
                          placeholder="https://example.com/logo.png"
                          value={newClient.logoUrl}
                          onChange={(e) => setNewClient({ ...newClient, logoUrl: e.target.value })}
                        />
                        <Text size="1" color="gray">
                          URL to the application logo image
                        </Text>
                      </div>

                      <Heading size="3" mt="4" mb="2">OAuth Credentials</Heading>

                      <div>
                        <Text as="label" size="2" mb="2" weight="medium">
                          Google Client ID
                        </Text>
                        <TextField.Root
                          placeholder="Google OAuth Client ID"
                          value={newClient.googleClientId}
                          onChange={(e) => setNewClient({ ...newClient, googleClientId: e.target.value })}
                        />
                      </div>

                      <div>
                        <Text as="label" size="2" mb="2" weight="medium">
                          Google Client Secret
                        </Text>
                        <TextField.Root
                          placeholder="Google OAuth Client Secret"
                          value={newClient.googleClientSecret}
                          onChange={(e) => setNewClient({ ...newClient, googleClientSecret: e.target.value })}
                        />
                      </div>

                      <div>
                        <Text as="label" size="2" mb="2" weight="medium">
                          Facebook App ID
                        </Text>
                        <TextField.Root
                          placeholder="Facebook App ID"
                          value={newClient.facebookAppId}
                          onChange={(e) => setNewClient({ ...newClient, facebookAppId: e.target.value })}
                        />
                      </div>

                      <div>
                        <Text as="label" size="2" mb="2" weight="medium">
                          Facebook App Secret
                        </Text>
                        <TextField.Root
                          placeholder="Facebook App Secret"
                          value={newClient.facebookAppSecret}
                          onChange={(e) => setNewClient({ ...newClient, facebookAppSecret: e.target.value })}
                        />
                      </div>

                      <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                          <Button variant="soft" color="gray">
                            Cancel
                          </Button>
                        </Dialog.Close>
                        <Button type="submit">Create Client</Button>
                      </Flex>
                    </Flex>
                  </form>
                </Dialog.Content>
              </Dialog.Root>
            </Flex>

            {/* Edit Dialog */}
            <Dialog.Root open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <Dialog.Content style={{ maxWidth: 560 }}>
                <Dialog.Title>Edit Client</Dialog.Title>
                <Dialog.Description size="2" mb="4">
                  Modify the client application settings.
                </Dialog.Description>

                <form onSubmit={handleEditClient}>
                  <Flex direction="column" gap="4">
                    <div>
                      <Text as="label" size="2" mb="2" weight="medium">
                        Client Name
                      </Text>
                      <TextField.Root
                        placeholder="My Application"
                        value={editClient.name}
                        onChange={(e) => setEditClient({ ...editClient, name: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <Text as="label" size="2" mb="2" weight="medium">
                        Allowed Origins
                      </Text>
                      <TextField.Root
                        placeholder="https://app1.com, https://app2.com"
                        value={editClient.allowedOrigins}
                        onChange={(e) => setEditClient({ ...editClient, allowedOrigins: e.target.value })}
                        required
                      />
                      <Text size="1" color="gray">
                        Comma-separated list of allowed origins
                      </Text>
                    </div>

                    <div>
                      <Text as="label" size="2" mb="2" weight="medium">
                        Redirect URLs
                      </Text>
                      <TextField.Root
                        placeholder="https://app1.com/callback, https://app2.com/callback"
                        value={editClient.redirectUrls}
                        onChange={(e) => setEditClient({ ...editClient, redirectUrls: e.target.value })}
                        required
                      />
                      <Text size="1" color="gray">
                        Comma-separated list of redirect URLs
                      </Text>
                    </div>

                    <div>
                      <Text as="label" size="2" mb="2" weight="medium">
                        Logo URL
                      </Text>
                      <TextField.Root
                        placeholder="https://example.com/logo.png"
                        value={editClient.logoUrl}
                        onChange={(e) => setEditClient({ ...editClient, logoUrl: e.target.value })}
                      />
                      <Text size="1" color="gray">
                        URL to the application logo image
                      </Text>
                    </div>

                    <Heading size="3" mt="4" mb="2">OAuth Credentials</Heading>

                    <div>
                      <Text as="label" size="2" mb="2" weight="medium">
                        Google Client ID
                      </Text>
                      <TextField.Root
                        placeholder="Google OAuth Client ID"
                        value={editClient.googleClientId}
                        onChange={(e) => setEditClient({ ...editClient, googleClientId: e.target.value })}
                      />
                    </div>

                    <div>
                      <Text as="label" size="2" mb="2" weight="medium">
                        Google Client Secret
                      </Text>
                      <TextField.Root
                        placeholder="Google OAuth Client Secret"
                        value={editClient.googleClientSecret}
                        onChange={(e) => setEditClient({ ...editClient, googleClientSecret: e.target.value })}
                      />
                    </div>

                    <div>
                      <Text as="label" size="2" mb="2" weight="medium">
                        Facebook App ID
                      </Text>
                      <TextField.Root
                        placeholder="Facebook App ID"
                        value={editClient.facebookAppId}
                        onChange={(e) => setEditClient({ ...editClient, facebookAppId: e.target.value })}
                      />
                    </div>

                    <div>
                      <Text as="label" size="2" mb="2" weight="medium">
                        Facebook App Secret
                      </Text>
                      <TextField.Root
                        placeholder="Facebook App Secret"
                        value={editClient.facebookAppSecret}
                        onChange={(e) => setEditClient({ ...editClient, facebookAppSecret: e.target.value })}
                      />
                    </div>

                    <Flex gap="3" mt="4" justify="end">
                      <Dialog.Close>
                        <Button variant="soft" color="gray">
                          Cancel
                        </Button>
                      </Dialog.Close>
                      <Button type="submit">Update Client</Button>
                    </Flex>
                  </Flex>
                </form>
              </Dialog.Content>
            </Dialog.Root>

            {/* Delete Confirmation Dialog */}
            <AlertDialog.Root open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialog.Content>
                <AlertDialog.Title>Delete Client</AlertDialog.Title>
                <AlertDialog.Description>
                  Are you sure you want to delete client "{selectedClient?.name}"? This action cannot be undone.
                </AlertDialog.Description>

                <Flex gap="3" mt="4" justify="end">
                  <AlertDialog.Cancel>
                    <Button variant="soft" color="gray">
                      Cancel
                    </Button>
                  </AlertDialog.Cancel>
                  <AlertDialog.Action>
                    <Button variant="solid" color="red" onClick={handleDeleteClient}>
                      Delete Client
                    </Button>
                  </AlertDialog.Action>
                </Flex>
              </AlertDialog.Content>
            </AlertDialog.Root>

            <ScrollArea>
              <Table.Root variant="surface">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Name</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Allowed Origins</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Redirect URLs</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Logo URL</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Google OAuth</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Facebook OAuth</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Token</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Actions</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>

                <Table.Body>
                  {isLoading ? (
                    <Table.Row>
                      <Table.Cell colSpan={6}>
                        <Text align="center">Loading clients...</Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : error ? (
                    <Table.Row>
                      <Table.Cell colSpan={6}>
                        <Text align="center" color="red">{error}</Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : clients.length === 0 ? (
                    <Table.Row>
                      <Table.Cell colSpan={6}>
                        <Text align="center">No clients found</Text>
                      </Table.Cell>
                    </Table.Row>
                  ) : (
                    clients.map((client) => (
                      <Table.Row key={client._id}>
                        <Table.Cell>{client.name}</Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {client.allowedOrigins.join(', ')}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {client.redirectUrls.join(', ')}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {client.logoUrl || 'Not set'}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={client.googleClientId && client.googleClientSecret ? 'green' : 'gray'}>
                            {client.googleClientId && client.googleClientSecret ? 'Configured' : 'Not configured'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Badge color={client.facebookAppId && client.facebookAppSecret ? 'green' : 'gray'}>
                            {client.facebookAppId && client.facebookAppSecret ? 'Configured' : 'Not configured'}
                          </Badge>
                        </Table.Cell>
                        <Table.Cell>
                          <Text size="2">
                            {client.token}
                          </Text>
                        </Table.Cell>
                        <Table.Cell>
                          <Flex gap="2">
                            <Button 
                              variant="soft" 
                              size="1"
                              onClick={() => openEditDialog(client)}
                            >
                              <Pencil1Icon width="14" height="14" />
                            </Button>
                            <Button 
                              variant="soft" 
                              color="red" 
                              size="1"
                              onClick={() => openDeleteDialog(client)}
                            >
                              <TrashIcon width="14" height="14" />
                            </Button>
                          </Flex>
                        </Table.Cell>
                      </Table.Row>
                    ))
                  )}
                </Table.Body>
              </Table.Root>
            </ScrollArea>
          </Flex>
        </Card>
      </Container>
    </main>
  );
}
