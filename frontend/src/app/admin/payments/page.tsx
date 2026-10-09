'use client';

import { useQuery } from '@apollo/client';
import { AlertCircle, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { GET_PAYMENTS } from '@/lib/graphql/queries/payment.queries';
import type { PaymentStatus, PaymentsQueryData } from '@/lib/graphql/types/payment.types';

const PRODUCT_LABELS = { coffee: 'Coffee', meeting: 'Meeting' } as const;

const STATUS_CLASSES: Record<PaymentStatus, string> = {
  paid: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
  pending: 'border-border bg-muted text-muted-foreground',
  failed: 'border-red-500/40 bg-red-500/10 text-red-600 dark:text-red-400',
  refunded: 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400',
};

const formatAmount = (amount: number, currency: string) =>
  `${currency.toUpperCase()} ${(amount / 100).toFixed(2)}`;

export default function PaymentsAdminPage() {
  const { data, loading, error } = useQuery<PaymentsQueryData>(GET_PAYMENTS, {
    fetchPolicy: 'cache-and-network',
  });
  const payments = data?.payments ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Payments</h1>
        <p className="text-sm text-muted-foreground">
          Payments made through Support checkout, newest first. Refunds are issued from the Stripe dashboard.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      ) : loading && payments.length === 0 ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading payments…
        </div>
      ) : payments.length === 0 ? (
        <p className="text-muted-foreground">No payments yet.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supporter</TableHead>
                <TableHead>Product</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{format(parseISO(payment.createdAt), 'd MMM yyyy, HH:mm')}</TableCell>
                  <TableCell>{payment.email ?? '—'}</TableCell>
                  <TableCell>{PRODUCT_LABELS[payment.productKey]}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatAmount(payment.amount, payment.currency)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={STATUS_CLASSES[payment.status]}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
