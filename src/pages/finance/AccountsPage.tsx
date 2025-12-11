import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { financeService, type Account } from '@/services/finance.service';
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const accountSchema = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']),
  parentId: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

const accountTypes = [
  { value: 'ASSET', label: 'Asset', color: 'bg-blue-500' },
  { value: 'LIABILITY', label: 'Liability', color: 'bg-red-500' },
  { value: 'EQUITY', label: 'Equity', color: 'bg-purple-500' },
  { value: 'REVENUE', label: 'Revenue', color: 'bg-green-500' },
  { value: 'EXPENSE', label: 'Expense', color: 'bg-yellow-500' },
];

export function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      code: '',
      name: '',
      type: 'ASSET',
      parentId: undefined,
    },
  });

  const fetchAccounts = async () => {
    try {
      const data = await financeService.getAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
      toast.error('Failed to load accounts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleOpenDialog = (account?: Account) => {
    if (account) {
      setEditingAccount(account);
      form.reset({
        code: account.code,
        name: account.name,
        type: account.type as AccountFormData['type'],
        parentId: account.parentId || undefined,
      });
    } else {
      setEditingAccount(null);
      form.reset({
        code: '',
        name: '',
        type: 'ASSET',
        parentId: undefined,
      });
    }
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: AccountFormData) => {
    try {
      if (editingAccount) {
        await financeService.updateAccount(editingAccount.id, {
          ...data,
          parentId: data.parentId || undefined,
        });
        toast.success('Account updated successfully');
      } else {
        await financeService.createAccount({
          ...data,
          parentId: data.parentId || undefined,
        });
        toast.success('Account created successfully');
      }
      setIsDialogOpen(false);
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to save account');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this account?')) return;

    try {
      await financeService.deleteAccount(id);
      toast.success('Account deleted successfully');
      fetchAccounts();
    } catch (error) {
      toast.error('Failed to delete account');
    }
  };

  const getAccountTypeBadge = (type: string) => {
    const accountType = accountTypes.find((t) => t.value === type);
    return (
      <Badge variant="secondary" className={`${accountType?.color} text-white`}>
        {accountType?.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chart of Accounts</h1>
          <p className="text-muted-foreground">Manage your chart of accounts</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAccount ? 'Edit Account' : 'Add Account'}</DialogTitle>
              <DialogDescription>
                {editingAccount ? 'Update the account details below.' : 'Fill in the details to create a new account.'}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Code</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 1000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cash" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {accountTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Account (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)} 
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select parent account" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {accounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.code} - {account.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingAccount ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => {
                const parent = accounts.find((a) => a.id === account.parentId);
                return (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.code}</TableCell>
                    <TableCell>{account.name}</TableCell>
                    <TableCell>{getAccountTypeBadge(account.type)}</TableCell>
                    <TableCell>{parent ? `${parent.code} - ${parent.name}` : '-'}</TableCell>
                    <TableCell>${Number(account.balance || 0).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(account)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(account.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {accounts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No accounts found. Create your first account.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
