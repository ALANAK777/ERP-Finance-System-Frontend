import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { financeService, type JournalEntry } from '@/services/finance.service';
import { Plus, Eye, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/auth.store';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-500',
  PENDING: 'bg-yellow-500',
  APPROVED: 'bg-green-500',
  REJECTED: 'bg-red-500',
};

export function JournalEntriesPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { user } = useAuthStore();

  const fetchEntries = async () => {
    try {
      const response = await financeService.getJournalEntries();
      setEntries(response.data);
    } catch (error) {
      console.error('Failed to fetch journal entries:', error);
      toast.error('Failed to load journal entries');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleViewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
    setIsDetailOpen(true);
  };

  const handleApprove = async (id: string) => {
    try {
      await financeService.approveJournalEntry(id);
      toast.success('Journal entry approved');
      fetchEntries();
      setIsDetailOpen(false);
    } catch (error) {
      toast.error('Failed to approve entry');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await financeService.rejectJournalEntry(id, 'Rejected by user');
      toast.success('Journal entry rejected');
      fetchEntries();
      setIsDetailOpen(false);
    } catch (error) {
      toast.error('Failed to reject entry');
    }
  };

  const canApprove = user?.role === 'Admin' || user?.role === 'Finance Manager';

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
          <h1 className="text-3xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-muted-foreground">Manage double-entry bookkeeping records</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entry #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Debit</TableHead>
                <TableHead>Credit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry) => {
                const totalDebit = entry.lines?.reduce(
                  (sum, line) => sum + Number(line.debit || 0),
                  0
                ) || 0;
                const totalCredit = entry.lines?.reduce(
                  (sum, line) => sum + Number(line.credit || 0),
                  0
                ) || 0;

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.entryNumber}</TableCell>
                    <TableCell>{format(new Date(entry.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
                    <TableCell>${totalDebit.toLocaleString()}</TableCell>
                    <TableCell>${totalCredit.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className={`${statusColors[entry.status]} text-white`}>
                        {entry.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleViewEntry(entry)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
              {entries.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No journal entries found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Entry Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Journal Entry Details</DialogTitle>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Entry Number</p>
                  <p className="font-medium">{selectedEntry.entryNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{format(new Date(selectedEntry.date), 'MMM dd, yyyy')}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="font-medium">{selectedEntry.description}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={`${statusColors[selectedEntry.status]} text-white`}>
                    {selectedEntry.status}
                  </Badge>
                </div>
              </div>

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedEntry.lines?.map((line, index) => (
                      <TableRow key={index}>
                        <TableCell>{line.account?.name || 'Unknown Account'}</TableCell>
                        <TableCell>
                          {Number(line.debit) > 0 ? `$${Number(line.debit).toLocaleString()}` : '-'}
                        </TableCell>
                        <TableCell>
                          {Number(line.credit) > 0 ? `$${Number(line.credit).toLocaleString()}` : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {canApprove && selectedEntry.status === 'PENDING' && (
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => handleReject(selectedEntry.id)}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                  <Button onClick={() => handleApprove(selectedEntry.id)}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
