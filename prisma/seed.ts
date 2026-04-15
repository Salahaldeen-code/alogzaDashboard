import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data (optional - comment out if you want to keep existing data)
  await prisma.project.deleteMany()
  await prisma.client.deleteMany()
  await prisma.revenueTarget.deleteMany()
  await prisma.kpi.deleteMany()
  await prisma.risk.deleteMany()

  // Seed Revenue Targets
  console.log('📊 Creating revenue targets...')
  const revenueTargets = await Promise.all([
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-01-01'),
        targetAmount: 100000,
        actualAmount: 85000,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-02-01'),
        targetAmount: 100000,
        actualAmount: 92000,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-03-01'),
        targetAmount: 100000,
        actualAmount: 78000,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-04-01'),
        targetAmount: 100000,
        actualAmount: 105000,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-05-01'),
        targetAmount: 100000,
        actualAmount: 95000,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-06-01'),
        targetAmount: 100000,
        actualAmount: 88000,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-07-01'),
        targetAmount: 100000,
        actualAmount: 0,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-08-01'),
        targetAmount: 100000,
        actualAmount: 0,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-09-01'),
        targetAmount: 100000,
        actualAmount: 0,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-10-01'),
        targetAmount: 100000,
        actualAmount: 0,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-11-01'),
        targetAmount: 100000,
        actualAmount: 0,
      },
    }),
    prisma.revenueTarget.create({
      data: {
        month: new Date('2026-12-01'),
        targetAmount: 100000,
        actualAmount: 0,
      },
    }),
  ])

  // Seed Clients
  console.log('👥 Creating clients...')
  const client1 = await prisma.client.create({
    data: {
      name: 'Tech Solutions Inc',
      industry: 'Technology',
      contactPerson: 'John Smith',
      email: 'john@techsolutions.com',
      phone: '+60123456789',
      status: 'active',
      lifetimeValue: 250000,
    },
  })

  const client2 = await prisma.client.create({
    data: {
      name: 'Global Retail Corp',
      industry: 'Retail',
      contactPerson: 'Sarah Johnson',
      email: 'sarah@globalretail.com',
      phone: '+60198765432',
      status: 'active',
      lifetimeValue: 180000,
    },
  })

  const client3 = await prisma.client.create({
    data: {
      name: 'Finance Pro Ltd',
      industry: 'Finance',
      contactPerson: 'Michael Chen',
      email: 'michael@financepro.com',
      phone: '+60187654321',
      status: 'active',
      lifetimeValue: 320000,
    },
  })

  const client4 = await prisma.client.create({
    data: {
      name: 'Healthcare Plus',
      industry: 'Healthcare',
      contactPerson: 'Emily Wong',
      email: 'emily@healthcareplus.com',
      phone: '+60176543210',
      status: 'active',
      lifetimeValue: 150000,
    },
  })

  const client5 = await prisma.client.create({
    data: {
      name: 'Edu Academy',
      industry: 'Education',
      contactPerson: 'David Lee',
      email: 'david@eduacademy.com',
      phone: '+60165432109',
      status: 'prospective',
      lifetimeValue: 0,
    },
  })

  // Seed Projects
  console.log('🚀 Creating projects...')
  await Promise.all([
    prisma.project.create({
   
      data: {
        clientId: client1.id,
        name: 'Cloud Migration',
        description: 'Migrate legacy systems to cloud infrastructure',
        status: 'in-progress',
        startDate: new Date('2026-01-15'),
        endDate: new Date('2026-06-30'),
        budget: 120000,
        actualCost: 45000,
        revenue: 80000,
      },
    }),
    prisma.project.create({
      data: {
        clientId: client1.id,
        name: 'Mobile App Development',
        description: 'Build customer-facing mobile application',
        status: 'in-progress',
        startDate: new Date('2026-03-01'),
        endDate: new Date('2026-08-31'),
        budget: 95000,
        actualCost: 30000,
        revenue: 50000,
      },
    }),
    prisma.project.create({
      data: {
        clientId: client2.id,
        name: 'E-commerce Platform',
        description: 'Redesign and upgrade online shopping platform',
        status: 'planning',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-10-31'),
        budget: 150000,
        actualCost: 15000,
        revenue: 20000,
      },
    }),
    prisma.project.create({
      data: {
        clientId: client3.id,
        name: 'Payment Gateway Integration',
        description: 'Integrate new payment processing system',
        status: 'completed',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2026-02-28'),
        budget: 80000,
        actualCost: 75000,
        revenue: 80000,
      },
    }),
    prisma.project.create({
      data: {
        clientId: client3.id,
        name: 'Security Audit',
        description: 'Comprehensive security assessment and improvements',
        status: 'in-progress',
        startDate: new Date('2026-02-15'),
        endDate: new Date('2026-05-15'),
        budget: 65000,
        actualCost: 25000,
        revenue: 40000,
      },
    }),
    prisma.project.create({
      data: {
        clientId: client4.id,
        name: 'Patient Portal',
        description: 'Develop online patient management portal',
        status: 'in-progress',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-07-31'),
        budget: 110000,
        actualCost: 55000,
        revenue: 75000,
      },
    }),
    prisma.project.create({
      data: {
        clientId: client2.id,
        name: 'Inventory Management System',
        description: 'Automated inventory tracking solution',
        status: 'on-hold',
        startDate: new Date('2026-05-01'),
        endDate: new Date('2026-11-30'),
        budget: 85000,
        actualCost: 5000,
        revenue: 5000,
      },
    }),
  ])

  // Seed KPIs
  console.log('📈 Creating KPIs...')
  await Promise.all([
    prisma.kpi.create({
      data: {
        name: 'Monthly Revenue',
        category: 'Financial',
        targetValue: 100000,
        currentValue: 88000,
        unit: 'RM',
        period: 'monthly',
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'Active Clients',
        category: 'Business',
        targetValue: 8,
        currentValue: 4,
        unit: 'count',
        period: 'monthly',
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'Project Success Rate',
        category: 'Delivery',
        targetValue: 95,
        currentValue: 88,
        unit: '%',
        period: 'monthly',
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'Client Satisfaction',
        category: 'Quality',
        targetValue: 90,
        currentValue: 92,
        unit: '%',
        period: 'monthly',
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'Average Project Margin',
        category: 'Financial',
        targetValue: 30,
        currentValue: 28.5,
        unit: '%',
        period: 'monthly',
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'New Client Acquisition',
        category: 'Business',
        targetValue: 2,
        currentValue: 1,
        unit: 'count',
        period: 'monthly',
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'On-Time Delivery Rate',
        category: 'Delivery',
        targetValue: 85,
        currentValue: 75,
        unit: '%',
        period: 'monthly',
      },
    }),
    prisma.kpi.create({
      data: {
        name: 'Revenue per Client',
        category: 'Financial',
        targetValue: 12500,
        currentValue: 22000,
        unit: 'RM',
        period: 'monthly',
      },
    }),
  ])

  // Seed Risks
  console.log('⚠️ Creating risks...')
  await Promise.all([
    prisma.risk.create({
      data: {
        title: 'Revenue Below RM50K Threshold',
        description: 'Monthly revenue falling below critical RM50K minimum threshold',
        category: 'Financial',
        severity: 'critical',
        probability: 'medium',
        impact: 'Company sustainability at risk, potential cash flow issues',
        mitigationPlan: 'Accelerate sales pipeline, focus on quick-win projects, review pricing strategy',
        status: 'mitigating',
        owner: 'CFO',
      },
    }),
    prisma.risk.create({
      data: {
        title: 'Client Concentration Risk',
        description: 'Top 3 clients represent 75% of revenue',
        category: 'Business',
        severity: 'high',
        probability: 'high',
        impact: 'Loss of major client would severely impact revenue',
        mitigationPlan: 'Diversify client base, target 2 new clients per quarter',
        status: 'identified',
        owner: 'Sales Director',
      },
    }),
    prisma.risk.create({
      data: {
        title: 'Project Delivery Delays',
        description: 'Multiple projects at risk of missing deadlines',
        category: 'Delivery',
        severity: 'high',
        probability: 'medium',
        impact: 'Client dissatisfaction, penalty clauses, reputation damage',
        mitigationPlan: 'Resource reallocation, scope review, enhanced project monitoring',
        status: 'mitigating',
        owner: 'Project Manager',
      },
    }),
    prisma.risk.create({
      data: {
        title: 'Key Staff Turnover',
        description: 'Risk of losing senior technical staff',
        category: 'Operations',
        severity: 'high',
        probability: 'medium',
        impact: 'Project delays, knowledge loss, increased costs',
        mitigationPlan: 'Retention bonuses, career development plans, mentorship programs',
        status: 'identified',
        owner: 'HR Manager',
      },
    }),
    prisma.risk.create({
      data: {
        title: 'Technology Obsolescence',
        description: 'Current tech stack may become outdated',
        category: 'Technology',
        severity: 'medium',
        probability: 'low',
        impact: 'Reduced competitiveness, higher maintenance costs',
        mitigationPlan: 'Regular technology reviews, training budget, R&D investment',
        status: 'accepted',
        owner: 'CTO',
      },
    }),
    prisma.risk.create({
      data: {
        title: 'Cash Flow Volatility',
        description: 'Irregular payment schedules causing cash flow gaps',
        category: 'Financial',
        severity: 'high',
        probability: 'high',
        impact: 'Difficulty meeting payroll and operational expenses',
        mitigationPlan: 'Implement milestone-based billing, maintain cash reserves, credit facility',
        status: 'mitigating',
        owner: 'CFO',
      },
    }),
  ])

  console.log('✅ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

