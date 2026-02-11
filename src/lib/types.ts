export interface Profile {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  headline: string | null;
  bio: string | null;
  avatar_url: string | null;
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

export interface ProfileData {
  profile: Profile;
  stack: StackItem[];
  prompts: Prompt[];
}
