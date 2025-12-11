import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debug() {
  console.log('=== PAYMENTS ===');
  const payments = await prisma.payment.findMany({
    include: { invoice: true },
  });
  console.log('Total payments:', payments.length);
  payments.forEach(p => {
    console.log(`- ${p.paymentNumber}: $${p.amount} for ${p.invoice?.invoiceNumber} (${p.invoice?.type})`);
  });

  console.log('\n=== JOURNAL ENTRIES ===');
  const journals = await prisma.journalEntry.findMany({
    include: { lines: { include: { account: true } } },
    orderBy: { createdAt: 'asc' },
  });
  console.log('Total entries:', journals.length);
  
  journals.forEach(j => {
    console.log(`\n${j.entryNumber} [${j.status}]: ${j.description}`);
    j.lines.forEach(l => {
      const debit = Number(l.debit);
      const credit = Number(l.credit);
      console.log(`  ${l.account?.code} ${l.account?.name}: DR=$${debit.toLocaleString()} CR=$${credit.toLocaleString()}`);
    });
  });

  console.log('\n=== ACCOUNT BALANCES ===');
  const accounts = await prisma.account.findMany({
    orderBy: { code: 'asc' },
  });
  accounts.forEach(a => {
    const bal = Number(a.balance);
    if (bal !== 0) {
      console.log(`${a.code} ${a.name}: $${bal.toLocaleString()}`);
    }
  });

  await prisma.$disconnect();
}

debug().catch(console.error);
