export type PlanStyle = "budget" | "balanced" | "comfort";
export type Difficulty = "easy" | "moderate" | "challenging";

export interface PlanBudgetItem {
  label: string;
  amount: number;
}

export interface PlanStep {
  when: string;
  title: string;
  detail: string;
}

export interface PlanContent {
  summary: string;
  difficulty: Difficulty;
  duration_label: string;
  estimated_total: number;
  budget_is_estimate: boolean;
  budget: PlanBudgetItem[];
  timeline: PlanStep[];
  checklist: string[];
  tips: string[];
}

export interface PlanInputs {
  budget: number | null;
  days: number;
  people: number;
  style: PlanStyle;
  notes: string;
}

export interface WishPlan {
  id: string;
  wish: string;
  inputs: PlanInputs;
  content: PlanContent;
  checked: number[];
  provider: string;
  language: string;
  generated_at: string;
  updated_at: string;
  fallback?: boolean; // only present on the reply to "generate"
}

/** The planner form keeps everything as text so empty boxes stay empty. */
export interface PlanFormValues {
  budget: string;
  days: string;
  people: string;
  style: PlanStyle;
  notes: string;
}