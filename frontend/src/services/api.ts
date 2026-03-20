import axios from 'axios';
import type {
  AuthTokens,
  LoginCredentials,
  RegisterCredentials,
  User,
  ResumeAnalysis,
  JDAnalysis,
  InterviewSession,
  InterviewAnswer,
  LearningRoadmap,
  CRIScore,
  AnalysisStatus,
  JobListing,
  JobApplication,
  MatchScoreResult,
  CoverLetterResult,
  ApplyKit,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ─── Interceptor: attach JWT token ──────────────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Interceptor: handle 401 ────────────────────────────
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthRoute = err.config?.url?.startsWith('/auth/');
    if (err.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ═══════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════
export const authAPI = {
  login: async (creds: LoginCredentials): Promise<AuthTokens> => {
    const { data } = await api.post('/auth/login', creds);
    return data;
  },

  register: async (creds: RegisterCredentials): Promise<AuthTokens> => {
    const { data } = await api.post('/auth/register', creds);
    return data;
  },

  getProfile: async (): Promise<User> => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  refreshToken: async (): Promise<AuthTokens> => {
    const { data } = await api.post('/auth/refresh');
    return data;
  },

  googleAuth: async (accessToken: string): Promise<AuthTokens> => {
    const { data } = await api.post('/auth/google', { access_token: accessToken });
    return data;
  },
};

// ═══════════════════════════════════════════════════════
// RESUME
// ═══════════════════════════════════════════════════════
export const resumeAPI = {
  analyze: async (file: File, jdText: string): Promise<ResumeAnalysis> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jd_text', jdText);
    const { data } = await api.post('/resume/analyze', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getHistory: async (): Promise<ResumeAnalysis[]> => {
    const { data } = await api.get('/resume/history');
    return data;
  },

  getById: async (id: string): Promise<ResumeAnalysis> => {
    const { data } = await api.get(`/resume/${id}`);
    return data;
  },
};

// ═══════════════════════════════════════════════════════
// JD INTELLIGENCE
// ═══════════════════════════════════════════════════════
export const jdAPI = {
  analyze: async (jdText: string, candidateSkills: string[]): Promise<JDAnalysis> => {
    const { data } = await api.post('/jd/analyze', { jd_text: jdText, candidate_skills: candidateSkills });
    return data;
  },

  getHistory: async (): Promise<JDAnalysis[]> => {
    const { data } = await api.get('/jd/history');
    return data;
  },
};

// ═══════════════════════════════════════════════════════
// INTERVIEW
// ═══════════════════════════════════════════════════════
export const interviewAPI = {
  startSession: async (
    resumeAnalysisId: string,
    jobRole: string,
    difficulty: string
  ): Promise<InterviewSession> => {
    const { data } = await api.post('/interview/start', {
      resume_analysis_id: resumeAnalysisId,
      job_role: jobRole,
      difficulty,
    });
    return data;
  },

  uploadAnswer: async (sessionId: string, questionIndex: number, videoBlob: Blob): Promise<void> => {
    const formData = new FormData();
    formData.append('video', videoBlob, `answer_${questionIndex}.webm`);
    formData.append('question_index', String(questionIndex));
    await api.post(`/interview/${sessionId}/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getSession: async (id: string): Promise<InterviewSession> => {
    const { data } = await api.get(`/interview/${id}`);
    return data;
  },

  getAnswers: async (sessionId: string): Promise<InterviewAnswer[]> => {
    const { data } = await api.get(`/interview/${sessionId}/answers`);
    return data;
  },

  getSessions: async (): Promise<InterviewSession[]> => {
    const { data } = await api.get('/interview/sessions');
    return data;
  },
};

// ═══════════════════════════════════════════════════════
// ANALYSIS
// ═══════════════════════════════════════════════════════
export const analysisAPI = {
  getStatus: async (sessionId: string): Promise<AnalysisStatus> => {
    const { data } = await api.get(`/interview/${sessionId}/status`);
    return data;
  },

  triggerAnalysis: async (sessionId: string): Promise<void> => {
    await api.post(`/interview/${sessionId}/trigger`);
  },
};

// ═══════════════════════════════════════════════════════
// ROADMAP
// ═══════════════════════════════════════════════════════
export const roadmapAPI = {
  generate: async (sessionId: string): Promise<LearningRoadmap> => {
    const { data } = await api.post(`/roadmap/generate`, { session_id: sessionId });
    return data;
  },

  getBySession: async (sessionId: string): Promise<LearningRoadmap> => {
    const { data } = await api.get(`/roadmap/${sessionId}`);
    return data;
  },

  getAll: async (): Promise<LearningRoadmap[]> => {
    const { data } = await api.get('/roadmap/all');
    return data;
  },
};

// ═══════════════════════════════════════════════════════
// CRI (Career Readiness Index)
// ═══════════════════════════════════════════════════════
export const criAPI = {
  getCurrent: async (): Promise<CRIScore> => {
    const { data } = await api.get('/cri/current');
    return data;
  },

  getHistory: async (): Promise<CRIScore[]> => {
    const { data } = await api.get('/cri/history');
    return data;
  },
};

// ═══════════════════════════════════════════════════════
// Jobs & Applications
// ═══════════════════════════════════════════════════════
export const jobsAPI = {
  search: async (params: { query: string; location?: string; remote_only?: boolean; page?: number }): Promise<JobListing[]> => {
    const { data } = await api.get('/jobs/search', { params });
    return data;
  },

  getMatchScore: async (jobDescription: string, resumeAnalysisId: string): Promise<MatchScoreResult> => {
    const { data } = await api.post('/jobs/match-score', { job_description: jobDescription, resume_analysis_id: resumeAnalysisId });
    return data;
  },

  generateCoverLetter: async (req: { job_title: string; company: string; job_description: string; resume_analysis_id: string }): Promise<CoverLetterResult> => {
    const { data } = await api.post('/jobs/generate-cover-letter', req);
    return data;
  },

  apply: async (req: {
    job_id: string; job_title: string; company: string; location: string;
    apply_url: string; job_description: string; salary_range?: string | null;
    employer_logo?: string | null; match_score: number; cover_letter: string;
    resume_analysis_id?: string | null;
  }): Promise<JobApplication> => {
    const { data } = await api.post('/jobs/apply', req);
    return data;
  },

  getApplications: async (): Promise<JobApplication[]> => {
    const { data } = await api.get('/jobs/applications');
    return data;
  },

  updateStatus: async (id: string, status: string): Promise<JobApplication> => {
    const { data } = await api.patch(`/jobs/applications/${id}`, { status });
    return data;
  },

  deleteApplication: async (id: string): Promise<void> => {
    await api.delete(`/jobs/applications/${id}`);
  },
};

// ═══════════════════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════════════════
export const profileAPI = {
  getMe: async () => {
    const { data } = await api.get('/profile/me');
    return data;
  },

  getApplyKit: async (): Promise<ApplyKit> => {
    const { data } = await api.get('/profile/apply-kit');
    return data;
  },

  update: async (updates: Record<string, unknown>) => {
    const { data } = await api.patch('/profile/me', updates);
    return data;
  },
};

export default api;
