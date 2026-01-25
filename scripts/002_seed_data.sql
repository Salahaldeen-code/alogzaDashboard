-- Seed Revenue Targets for 2026
INSERT INTO revenue_targets (month, target_amount, actual_amount) VALUES
  ('2026-01-01', 100000.00, 85000.00),
  ('2026-02-01', 100000.00, 92000.00),
  ('2026-03-01', 100000.00, 78000.00),
  ('2026-04-01', 100000.00, 105000.00),
  ('2026-05-01', 100000.00, 95000.00),
  ('2026-06-01', 100000.00, 88000.00),
  ('2026-07-01', 100000.00, 0.00),
  ('2026-08-01', 100000.00, 0.00),
  ('2026-09-01', 100000.00, 0.00),
  ('2026-10-01', 100000.00, 0.00),
  ('2026-11-01', 100000.00, 0.00),
  ('2026-12-01', 100000.00, 0.00)
ON CONFLICT (month) DO NOTHING;

-- Seed Clients
INSERT INTO clients (name, industry, contact_person, email, phone, status, lifetime_value) VALUES
  ('Tech Solutions Inc', 'Technology', 'John Smith', 'john@techsolutions.com', '+60123456789', 'active', 250000.00),
  ('Global Retail Corp', 'Retail', 'Sarah Johnson', 'sarah@globalretail.com', '+60198765432', 'active', 180000.00),
  ('Finance Pro Ltd', 'Finance', 'Michael Chen', 'michael@financepro.com', '+60187654321', 'active', 320000.00),
  ('Healthcare Plus', 'Healthcare', 'Emily Wong', 'emily@healthcareplus.com', '+60176543210', 'active', 150000.00),
  ('Edu Academy', 'Education', 'David Lee', 'david@eduacademy.com', '+60165432109', 'prospective', 0.00)
ON CONFLICT DO NOTHING;

-- Seed Projects (using actual client IDs)
DO $$
DECLARE
  client1_id UUID;
  client2_id UUID;
  client3_id UUID;
  client4_id UUID;
BEGIN
  SELECT id INTO client1_id FROM clients WHERE name = 'Tech Solutions Inc' LIMIT 1;
  SELECT id INTO client2_id FROM clients WHERE name = 'Global Retail Corp' LIMIT 1;
  SELECT id INTO client3_id FROM clients WHERE name = 'Finance Pro Ltd' LIMIT 1;
  SELECT id INTO client4_id FROM clients WHERE name = 'Healthcare Plus' LIMIT 1;

  INSERT INTO projects (client_id, name, description, status, start_date, end_date, budget, actual_cost, revenue) VALUES
    (client1_id, 'Cloud Migration', 'Migrate legacy systems to cloud infrastructure', 'in-progress', '2026-01-15', '2026-06-30', 120000.00, 45000.00, 80000.00),
    (client1_id, 'Mobile App Development', 'Build customer-facing mobile application', 'in-progress', '2026-03-01', '2026-08-31', 95000.00, 30000.00, 50000.00),
    (client2_id, 'E-commerce Platform', 'Redesign and upgrade online shopping platform', 'planning', '2026-04-01', '2026-10-31', 150000.00, 15000.00, 20000.00),
    (client3_id, 'Payment Gateway Integration', 'Integrate new payment processing system', 'completed', '2025-11-01', '2026-02-28', 80000.00, 75000.00, 80000.00),
    (client3_id, 'Security Audit', 'Comprehensive security assessment and improvements', 'in-progress', '2026-02-15', '2026-05-15', 65000.00, 25000.00, 40000.00),
    (client4_id, 'Patient Portal', 'Develop online patient management portal', 'in-progress', '2026-01-01', '2026-07-31', 110000.00, 55000.00, 75000.00),
    (client2_id, 'Inventory Management System', 'Automated inventory tracking solution', 'on-hold', '2026-05-01', '2026-11-30', 85000.00, 5000.00, 5000.00)
  ON CONFLICT DO NOTHING;
END $$;

-- Seed KPIs
INSERT INTO kpis (name, category, target_value, current_value, unit, period) VALUES
  ('Monthly Revenue', 'Financial', 100000.00, 88000.00, 'RM', 'monthly'),
  ('Active Clients', 'Business', 8.00, 4.00, 'count', 'monthly'),
  ('Project Success Rate', 'Delivery', 95.00, 88.00, '%', 'monthly'),
  ('Client Satisfaction', 'Quality', 90.00, 92.00, '%', 'monthly'),
  ('Average Project Margin', 'Financial', 30.00, 28.50, '%', 'monthly'),
  ('New Client Acquisition', 'Business', 2.00, 1.00, 'count', 'monthly'),
  ('On-Time Delivery Rate', 'Delivery', 85.00, 75.00, '%', 'monthly'),
  ('Revenue per Client', 'Financial', 12500.00, 22000.00, 'RM', 'monthly')
ON CONFLICT DO NOTHING;

-- Seed Risks
INSERT INTO risks (title, description, category, severity, probability, impact, mitigation_plan, status, owner) VALUES
  ('Revenue Below RM50K Threshold', 'Monthly revenue falling below critical RM50K minimum threshold', 'Financial', 'critical', 'medium', 'Company sustainability at risk, potential cash flow issues', 'Accelerate sales pipeline, focus on quick-win projects, review pricing strategy', 'mitigating', 'CFO'),
  ('Client Concentration Risk', 'Top 3 clients represent 75% of revenue', 'Business', 'high', 'high', 'Loss of major client would severely impact revenue', 'Diversify client base, target 2 new clients per quarter', 'identified', 'Sales Director'),
  ('Project Delivery Delays', 'Multiple projects at risk of missing deadlines', 'Delivery', 'high', 'medium', 'Client dissatisfaction, penalty clauses, reputation damage', 'Resource reallocation, scope review, enhanced project monitoring', 'mitigating', 'Project Manager'),
  ('Key Staff Turnover', 'Risk of losing senior technical staff', 'Operations', 'high', 'medium', 'Project delays, knowledge loss, increased costs', 'Retention bonuses, career development plans, mentorship programs', 'identified', 'HR Manager'),
  ('Technology Obsolescence', 'Current tech stack may become outdated', 'Technology', 'medium', 'low', 'Reduced competitiveness, higher maintenance costs', 'Regular technology reviews, training budget, R&D investment', 'accepted', 'CTO'),
  ('Cash Flow Volatility', 'Irregular payment schedules causing cash flow gaps', 'Financial', 'high', 'high', 'Difficulty meeting payroll and operational expenses', 'Implement milestone-based billing, maintain cash reserves, credit facility', 'mitigating', 'CFO')
ON CONFLICT DO NOTHING;
