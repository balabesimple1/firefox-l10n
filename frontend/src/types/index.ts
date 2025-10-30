export enum UserRole {
  ADMIN = 'admin',
  PRODUCT = 'product',
  FINANCE = 'finance',
  TRANSLATOR = 'translator',
}

export enum ProjectStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  REVIEW = 'review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum InvoiceStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
  APPROVED = 'approved',
  PAID = 'paid',
  REJECTED = 'rejected',
}

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Translator {
  id: number;
  user_id: number;
  specializations: string[];
  rates: Record<string, number>;
  bio?: string;
  is_available: boolean;
  created_at: string;
  user: User;
}

export interface Project {
  id: number;
  name: string;
  description?: string;
  repository_url?: string;
  status: ProjectStatus;
  target_locales: string[];
  auto_approval_threshold: number;
  created_by_id: number;
  created_at: string;
  updated_at?: string;
}

export interface TranslationTask {
  id: number;
  project_id: number;
  translator_id: number;
  locale: string;
  source_files: string[];
  target_files: string[];
  word_count: number;
  estimated_cost: number;
  actual_cost: number;
  estimated_hours: number;
  actual_hours: number;
  status: TaskStatus;
  deadline?: string;
  completed_at?: string;
  created_at: string;
  updated_at?: string;
  tm_matches?: any;
  ai_suggestions?: any;
  tm_savings: number;
  ai_savings: number;
  translation_stats?: {
    total: number;
    translated: number;
    warnings: number;
    errors: number;
  };
}

export interface Invoice {
  id: number;
  invoice_number: string;
  translator_id: number;
  project_id: number;
  period_start: string;
  period_end: string;
  total_amount: number;
  currency: string;
  status: InvoiceStatus;
  submitted_at?: string;
  approved_at?: string;
  paid_at?: string;
  created_at: string;
  line_items: Array<{
    task_id: number;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  notes?: string;
}

export interface LocaleStats {
  locale: string;
  total_strings: number;
  translated_strings: number;
  warnings: number;
  errors: number;
  completion_percentage: number;
  cost: number;
  tm_savings: number;
  ai_savings: number;
}

export interface ProjectReport {
  project_id: number;
  project_name: string;
  locale_stats: LocaleStats[];
  total_cost: number;
  total_savings: number;
  completion_percentage: number;
}

export interface TranslatorReport {
  translator_id: number;
  translator_name: string;
  total_earnings: number;
  completed_tasks: number;
  pending_tasks: number;
  average_quality_score: number;
}

export interface FinancialReport {
  period_start: string;
  period_end: string;
  total_spending: number;
  spending_by_project: Record<string, number>;
  spending_by_translator: Record<string, number>;
  spending_by_locale: Record<string, number>;
  projected_spending: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface ChatResponse {
  message: string;
  session_id: string;
  suggestions: string[];
}

export interface AITranslationRequest {
  source_text: string;
  source_locale: string;
  target_locale: string;
  use_glossary: boolean;
  use_tm: boolean;
}

export interface AITranslationResponse {
  target_text: string;
  confidence_score: number;
  model_used: string;
  tm_matches: Array<{
    source: string;
    target: string;
    quality_score: number;
    match_percentage: number;
  }>;
  glossary_matches: Array<{
    term: string;
    translation: string;
    definition?: string;
  }>;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}