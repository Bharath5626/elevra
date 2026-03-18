// ─── User ───────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
}

// ─── Resume Analysis ────────────────────────────────────
export interface SectionFeedback {
  summary: string;
  experience: string;
  skills: string;
  education: string;
}

export interface WeakBullet {
  original: string;
  improved: string;
}

export interface ResumeAnalysis {
  id: string;
  user_id: string;
  version_number: number;
  filename: string;
  raw_text: string;
  jd_text: string;
  ats_score: number;
  keyword_gaps: string[];
  skills_found?: string[];
  weak_bullets: WeakBullet[];
  improved_bullets: string[];
  section_feedback: SectionFeedback;
  bias_flags: string[];
  overall_suggestion: string;
  overall_readability?: number;
  created_at: string;
}

// ─── JD Analysis ────────────────────────────────────────
export interface JDAnalysis {
  id: string;
  user_id: string;
  raw_jd: string;
  role_title: string;
  required_skills: string[];
  nice_to_have: string[];
  culture_signals: string[];
  fit_score: number;
  missing_skills: string[];
  matching_skills: string[];
  recommendation: string;
  created_at: string;
}

// ─── Interview ──────────────────────────────────────────
export interface InterviewQuestion {
  id: number;
  text: string;
  type: 'technical' | 'behavioral';
  focus_area: string;
  expected_duration_seconds: number;
}

export interface InterviewSession {
  id: string;
  user_id: string;
  resume_analysis_id: string | null;
  job_role: string;
  difficulty: string;
  status: 'in_progress' | 'completed' | 'analyzing';
  questions: InterviewQuestion[];
  overall_score: number;
  created_at: string;
}

export interface FeedbackTimestamp {
  time_seconds: number;
  feedback: string;
  type: 'positive' | 'negative';
}

export interface EmotionScores {
  happy: number;
  neutral: number;
  sad: number;
  angry: number;
  surprise: number;
  fear: number;
  disgust: number;
}

export interface InterviewAnswer {
  id: string;
  session_id: string;
  question_index: number;
  question_text: string;
  video_url: string;
  transcript: string;
  filler_count: number;
  wpm: number;
  speech_clarity_score: number;
  eye_contact_pct: number;
  eye_contact_timeline: number[];
  emotion_scores: EmotionScores;
  confidence_score: number;
  technical_score: number;
  structure_score: number;
  depth_score: number;
  overall_score: number;
  strengths: string[];
  improvements: string[];
  star_format_used: boolean;
  feedback_timestamps: FeedbackTimestamp[];
  created_at: string;
}

// ─── Learning Roadmap ───────────────────────────────────
export interface RoadmapResource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'practice';
}

export interface RoadmapWeek {
  week: number;
  focus: string;
  daily_tasks: string[];
  resources: RoadmapResource[];
}

export interface LearningRoadmap {
  id: string;
  user_id: string;
  session_id: string;
  plan: {
    summary: string;
    weeks: RoadmapWeek[];
    quick_wins: string[];
  };
  generated_at: string;
}

// ─── CRI Score ──────────────────────────────────────────
export interface CRIScore {
  id: string;
  user_id: string;
  resume_score: number;
  interview_score: number;
  jd_fit_score: number;
  improvement_delta: number;
  cri_total: number;
  percentile: number;
  recorded_at: string;
  // Legacy / UI aliases (populated by mock or backend variants)
  overall_score?: number;
  jd_match_score?: number;
  percentile_rank?: number;
  trend?: string;
}

// ─── Question Bank ──────────────────────────────────────
export interface QuestionBankItem {
  id: string;
  text: string;
  type: string;
  role: string;
  difficulty: number;
  topic: string;
  model_answer: string;
  tags: string[];
}

// ─── Analysis Status ────────────────────────────────────
export interface AnalysisStatus {
  session_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0–100
  current_step: string;
}

// ─── CRI Band ───────────────────────────────────────────
export type CRIBand = 'Interview Ready' | 'Almost There' | 'Needs Improvement' | 'Significant Gaps';

export function getCRIBand(score: number): CRIBand {
  if (score >= 90) return 'Interview Ready';
  if (score >= 75) return 'Almost There';
  if (score >= 60) return 'Needs Improvement';
  return 'Significant Gaps';
}

export function getCRIBandColor(band: CRIBand): string {
  switch (band) {
    case 'Interview Ready': return '#10b981';
    case 'Almost There': return '#3b82f6';
    case 'Needs Improvement': return '#f59e0b';
    case 'Significant Gaps': return '#ef4444';
  }
}

// ─── Jobs & Applications ────────────────────────────────
export interface JobListing {
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  description: string;
  apply_url: string;
  salary_range?: string | null;
  posted_date?: string | null;
  employer_logo?: string | null;
  is_remote: boolean;
}

export interface JobSearchParams {
  query: string;
  location?: string;
  remote_only?: boolean;
  page?: number;
}

export interface MatchScoreResult {
  match_score: number;
  matching_skills: string[];
  missing_skills: string[];
}

export interface CoverLetterResult {
  cover_letter: string;
}

export interface JobApplication {
  id: string;
  user_id: string;
  job_id: string;
  job_title: string;
  company: string;
  location: string;
  apply_url: string;
  job_description: string;
  salary_range?: string | null;
  employer_logo?: string | null;
  match_score: number;
  cover_letter: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected';
  resume_analysis_id?: string | null;
  applied_at: string;
}

// ─── One-Click Apply Profile ─────────────────────────────
export interface ApplyKit {
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  location: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  headline: string | null;
  resumeBase64: string | null;
  resumeFilename: string | null;
  resumeAnalysisId: string | null;
  latestAtsScore: number | null;
  skills: string[];
}
