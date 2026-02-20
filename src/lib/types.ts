export interface Profile {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  melbo_score: number;
  melbo_score_label: string;
  melbo_score_updated_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StackItem {
  id: string;
  profile_id: string;
  tool_name: string;
  description: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface Prompt {
  id: string;
  profile_id: string;
  title: string;
  prompt_text: string;
  description: string | null;
  category: string | null;
  save_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Save {
  id: string;
  prompt_id: string;
  saver_ip: string | null;
  created_at: string;
}

export interface ImpactStat {
  id: string;
  profile_id: string;
  metric: string;
  before_value: string | null;
  after_value: string;
  context: string | null;
  sort_order: number;
  created_at: string;
}

export interface WorkflowStep {
  order: number;
  tool: string;
  action: string;
}

export interface Workflow {
  id: string;
  profile_id: string;
  title: string;
  description: string | null;
  steps: WorkflowStep[];
  save_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface WorkflowSave {
  id: string;
  workflow_id: string;
  saver_ip: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  profile_id: string;
  title: string;
  url: string;
  resource_type: string;
  sort_order: number;
  created_at: string;
}

export interface ProfileData {
  profile: Profile;
  stack: StackItem[];
  prompts: Prompt[];
  impact_stats: ImpactStat[];
  workflows: Workflow[];
  resources: Resource[];
}
