export interface RevenueTarget {
  id: string
  month: string
  year?: number // Added optional year field
  target_amount: number
  actual_amount: number
  status?: "pending" | "achieved" | "missed" // Added optional status field
  notes?: string // Added optional notes field
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  industry: string | null
  contact_person: string | null
  email: string | null
  phone: string | null
  status: "active" | "inactive" | "prospective"
  lifetime_value: number
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string
  name: string
  description: string | null
  status: "planning" | "in-progress" | "completed" | "on-hold" | "cancelled" | "prospective" | "potential" | "pending"
  progress_notes?: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  actual_cost: number
  revenue: number
  amount_paid?: number
  payment_date?: string | null
  created_at: string
  updated_at: string
  clients?: Client
}

export interface KPI {
  id: string
  name: string
  category: string
  target_value: number
  current_value: number
  unit: string | null
  period: "daily" | "weekly" | "monthly" | "quarterly" | "yearly"
  created_at: string
  updated_at: string
}

export interface Risk {
  id: string
  project_id?: string | null
  title: string
  description: string | null
  category: string | null
  severity: "low" | "medium" | "high" | "critical"
  probability: "low" | "medium" | "high"
  risk_score?: number | null
  risk_level?: "Low" | "Medium" | "High" | null
  impact: string | null
  mitigation_plan: string | null
  status: "identified" | "mitigating" | "resolved" | "accepted"
  owner: string | null
  identified_date?: string | null
  target_resolution_date?: string | null
  estimated_financial_impact?: number | null
  created_at: string
  updated_at: string
  project?: Project | null
}

export interface Expense {
  id: string
  project_id?: string | null
  category: string
  amount: number
  spent_at: string
  vendor?: string | null
  note?: string | null
  created_at: string
  updated_at: string
  project?: Project | null
}

export interface Developer {
  id: string
  name: string
  role: string
  email?: string | null
  phone?: string | null
  hourly_rate?: number | null
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

export interface ProjectDeveloper {
  id: string
  project_id: string
  developer_id?: string | null
  name: string
  role: string
  amount: number
  created_at: string
  updated_at: string
  project?: Project | null
  developer?: Developer | null
}

export interface Task {
  id: string
  title: string
  description?: string | null
  status: "todo" | "in-progress" | "done" | "blocked"
  developer_id: string
  project_id?: string | null
  estimated_hours?: number | null
  actual_hours: number
  start_time?: string | null
  end_time?: string | null
  due_date?: string | null
  priority: "low" | "medium" | "high" | "urgent"
  created_at: string
  updated_at: string
  developer?: Developer | null
  project?: Project | null
}

export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "developer" | "general"
  created_at: string
  updated_at: string
}
