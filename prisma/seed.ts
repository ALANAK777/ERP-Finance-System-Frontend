import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create Permissions
  const permissions = await Promise.all([
    prisma.permission.upsert({
      where: { name: 'users:read' },
      update: {},
      create: { name: 'users:read', description: 'View users' },
    }),
    prisma.permission.upsert({
      where: { name: 'users:write' },
      update: {},
      create: { name: 'users:write', description: 'Create/Edit users' },
    }),
    prisma.permission.upsert({
      where: { name: 'finance:read' },
      update: {},
      create: { name: 'finance:read', description: 'View financial data' },
    }),
    prisma.permission.upsert({
      where: { name: 'finance:write' },
      update: {},
      create: { name: 'finance:write', description: 'Create/Edit financial data' },
    }),
    prisma.permission.upsert({
      where: { name: 'projects:read' },
      update: {},
      create: { name: 'projects:read', description: 'View projects' },
    }),
    prisma.permission.upsert({
      where: { name: 'projects:write' },
      update: {},
      create: { name: 'projects:write', description: 'Create/Edit projects' },
    }),
  ]);

  console.log('✅ Permissions created');

  // Create Roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
      description: 'Full system access',
      permissions: { connect: permissions.map((p) => ({ id: p.id })) },
    },
  });

  const financeRole = await prisma.role.upsert({
    where: { name: 'Finance Manager' },
    update: {},
    create: {
      name: 'Finance Manager',
      description: 'Finance module access',
      permissions: {
        connect: permissions
          .filter((p) => p.name.includes('finance') || p.name === 'projects:read')
          .map((p) => ({ id: p.id })),
      },
    },
  });

  const projectRole = await prisma.role.upsert({
    where: { name: 'Project Manager' },
    update: {},
    create: {
      name: 'Project Manager',
      description: 'Project module access',
      permissions: {
        connect: permissions
          .filter((p) => p.name.includes('projects') || p.name === 'finance:read')
          .map((p) => ({ id: p.id })),
      },
    },
  });

  console.log('✅ Roles created');

  // Create Users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@erp.com' },
    update: {},
    create: {
      email: 'admin@erp.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      roleId: adminRole.id,
    },
  });

  const financeUser = await prisma.user.upsert({
    where: { email: 'finance@erp.com' },
    update: {},
    create: {
      email: 'finance@erp.com',
      password: hashedPassword,
      firstName: 'Finance',
      lastName: 'Manager',
      roleId: financeRole.id,
    },
  });

  const projectUser = await prisma.user.upsert({
    where: { email: 'project@erp.com' },
    update: {},
    create: {
      email: 'project@erp.com',
      password: hashedPassword,
      firstName: 'Project',
      lastName: 'Manager',
      roleId: projectRole.id,
    },
  });

  console.log('✅ Users created');

  // Create Chart of Accounts
  const accounts = [
    { code: '1000', name: 'Cash', type: 'ASSET' as const },
    { code: '1100', name: 'Accounts Receivable', type: 'ASSET' as const },
    { code: '1200', name: 'Inventory', type: 'ASSET' as const },
    { code: '1500', name: 'Fixed Assets', type: 'ASSET' as const },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' as const },
    { code: '2100', name: 'Accrued Expenses', type: 'LIABILITY' as const },
    { code: '2500', name: 'Long-term Debt', type: 'LIABILITY' as const },
    { code: '3000', name: 'Common Stock', type: 'EQUITY' as const },
    { code: '3100', name: 'Retained Earnings', type: 'EQUITY' as const },
    { code: '4000', name: 'Sales Revenue', type: 'REVENUE' as const },
    { code: '4100', name: 'Service Revenue', type: 'REVENUE' as const },
    { code: '5000', name: 'Cost of Goods Sold', type: 'EXPENSE' as const },
    { code: '5100', name: 'Salaries Expense', type: 'EXPENSE' as const },
    { code: '5200', name: 'Rent Expense', type: 'EXPENSE' as const },
    { code: '5300', name: 'Utilities Expense', type: 'EXPENSE' as const },
  ];

  for (const account of accounts) {
    await prisma.account.upsert({
      where: { code: account.code },
      update: {},
      create: account,
    });
  }

  console.log('✅ Chart of Accounts created');

  // Create Customers
  const customersData = [
    { code: 'CUST001', name: 'Metro Construction Co.', email: 'contact@metroconstruction.com', phone: '555-0101', paymentTerms: 30, creditLimit: 500000 },
    { code: 'CUST002', name: 'Green Building Ltd.', email: 'info@greenbuilding.com', phone: '555-0102', paymentTerms: 45, creditLimit: 750000 },
    { code: 'CUST003', name: 'City Infrastructure Inc.', email: 'sales@cityinfra.com', phone: '555-0103', paymentTerms: 30, creditLimit: 1000000 },
  ];

  for (const customer of customersData) {
    await prisma.customer.upsert({
      where: { code: customer.code },
      update: {},
      create: customer,
    });
  }

  console.log('✅ Customers created');

  // Create Vendors
  const vendorsData = [
    { code: 'VEND001', name: 'Steel Supply Corp', email: 'orders@steelsupply.com', phone: '555-0201', paymentTerms: 30 },
    { code: 'VEND002', name: 'Concrete Masters', email: 'sales@concretemasters.com', phone: '555-0202', paymentTerms: 15 },
    { code: 'VEND003', name: 'Equipment Rentals LLC', email: 'rentals@equiprent.com', phone: '555-0203', paymentTerms: 7 },
  ];

  for (const vendor of vendorsData) {
    await prisma.vendor.upsert({
      where: { code: vendor.code },
      update: {},
      create: vendor,
    });
  }

  console.log('✅ Vendors created');

  // Create Projects
  const projectsData = [
    {
      code: 'PRJ001',
      name: 'Downtown Office Tower',
      description: 'Construction of 20-story office building',
      location: 'Downtown Business District',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2026-06-30'),
      budget: 15000000,
      actualCost: 3500000,
      status: 'IN_PROGRESS' as const,
    },
    {
      code: 'PRJ002',
      name: 'Highway Bridge Renovation',
      description: 'Renovation of Main Street bridge',
      location: 'Highway 101',
      startDate: new Date('2025-03-01'),
      endDate: new Date('2025-12-31'),
      budget: 5000000,
      actualCost: 2200000,
      status: 'IN_PROGRESS' as const,
    },
    {
      code: 'PRJ003',
      name: 'Residential Complex Phase 1',
      description: 'Construction of 50-unit residential complex',
      location: 'Suburban Heights',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-12-31'),
      budget: 25000000,
      actualCost: 0,
      status: 'PLANNING' as const,
    },
  ];

  const createdProjects = [];
  for (const project of projectsData) {
    const created = await prisma.project.upsert({
      where: { code: project.code },
      update: {},
      create: project,
    });
    createdProjects.push(created);
  }

  console.log('✅ Projects created');

  // Create Project Progress
  if (createdProjects.length > 0) {
    const prj1 = createdProjects.find(p => p.code === 'PRJ001');
    const prj2 = createdProjects.find(p => p.code === 'PRJ002');

    if (prj1) {
      await prisma.projectProgress.createMany({
        data: [
          {
            projectId: prj1.id,
            date: new Date('2025-02-01'),
            plannedProgress: 10,
            actualProgress: 8,
            notes: 'Initial foundation work - slight delay due to weather',
          },
          {
            projectId: prj1.id,
            date: new Date('2025-03-01'),
            plannedProgress: 20,
            actualProgress: 18,
            notes: 'Foundation complete, structural work started',
          },
          {
            projectId: prj1.id,
            date: new Date('2025-04-01'),
            plannedProgress: 30,
            actualProgress: 28,
            notes: 'Catching up on schedule',
          },
        ],
      });
    }

    if (prj2) {
      await prisma.projectProgress.createMany({
        data: [
          {
            projectId: prj2.id,
            date: new Date('2025-04-01'),
            plannedProgress: 15,
            actualProgress: 18,
            notes: 'Ahead of schedule',
          },
          {
            projectId: prj2.id,
            date: new Date('2025-05-01'),
            plannedProgress: 30,
            actualProgress: 35,
            notes: 'Excellent progress, favorable conditions',
          },
          {
            projectId: prj2.id,
            date: new Date('2025-06-01'),
            plannedProgress: 45,
            actualProgress: 48,
            notes: 'Bridge deck installation ahead of schedule',
          },
        ],
      });
    }

    // Create Risk Logs
    if (prj1) {
      await prisma.riskLog.createMany({
        data: [
          {
            projectId: prj1.id,
            riskScore: 35,
            riskLevel: 'MEDIUM',
            factors: {
              delayedInvoices: 2,
              budgetOverrun: 5,
              progressMismatch: 2,
            },
            calculatedAt: new Date('2025-03-15'),
          },
          {
            projectId: prj1.id,
            riskScore: 28,
            riskLevel: 'LOW',
            factors: {
              delayedInvoices: 1,
              budgetOverrun: 3,
              progressMismatch: 2,
            },
            calculatedAt: new Date('2025-04-15'),
          },
        ],
      });
    }

    if (prj2) {
      await prisma.riskLog.createMany({
        data: [
          {
            projectId: prj2.id,
            riskScore: 15,
            riskLevel: 'LOW',
            factors: {
              delayedInvoices: 0,
              budgetOverrun: 0,
              progressMismatch: -3,
            },
            calculatedAt: new Date('2025-05-01'),
          },
        ],
      });
    }
  }

  console.log('✅ Project Progress & Risk Logs created');

  // Create Exchange Rates
  const exchangeRates = [
    { fromCurrency: 'USD', toCurrency: 'EUR', rate: 0.92, effectiveDate: new Date() },
    { fromCurrency: 'USD', toCurrency: 'GBP', rate: 0.79, effectiveDate: new Date() },
    { fromCurrency: 'USD', toCurrency: 'INR', rate: 83.12, effectiveDate: new Date() },
    { fromCurrency: 'USD', toCurrency: 'CAD', rate: 1.36, effectiveDate: new Date() },
  ];

  for (const rate of exchangeRates) {
    await prisma.exchangeRate.create({
      data: rate,
    });
  }

  console.log('✅ Exchange rates created');

  // Create Budget
  const budget = await prisma.budget.create({
    data: {
      name: 'FY 2024 Budget',
      fiscalYear: 2024,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      items: {
        create: [
          { category: 'Revenue', planned: 10000000 },
          { category: 'Salaries', planned: 3000000 },
          { category: 'Materials', planned: 4000000 },
          { category: 'Equipment', planned: 1500000 },
          { category: 'Overhead', planned: 500000 },
        ],
      },
    },
  });

  console.log('✅ Budget created');

  // Create sample cash flow data
  const cashFlowData = [];
  for (let i = 5; i >= 0; i--) {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    
    cashFlowData.push({
      date,
      type: 'INFLOW' as const,
      category: 'Customer Payment',
      amount: 500000 + Math.random() * 200000,
      description: 'Monthly customer payments',
    });
    
    cashFlowData.push({
      date,
      type: 'OUTFLOW' as const,
      category: 'Vendor Payment',
      amount: 300000 + Math.random() * 100000,
      description: 'Monthly vendor payments',
    });
    
    cashFlowData.push({
      date,
      type: 'OUTFLOW' as const,
      category: 'Salaries',
      amount: 250000,
      description: 'Monthly payroll',
    });
  }

  for (const cf of cashFlowData) {
    await prisma.cashFlow.create({ data: cf });
  }

  console.log('✅ Cash flow data created');

  console.log('🎉 Seed completed successfully!');
  console.log('\n📝 Test Credentials:');
  console.log('   Admin: admin@erp.com / password123');
  console.log('   Finance: finance@erp.com / password123');
  console.log('   Project: project@erp.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
