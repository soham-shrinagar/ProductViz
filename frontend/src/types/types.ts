export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
  } | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  size: number;
  default_branch: string;
}

export interface GitHubContributor {
  login: string;
  id: number;
  avatar_url: string;
  contributions: number;
  html_url: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    author: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
  };
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  } | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  created_at: string;
  closed_at: string | null;
  labels: Array<{
    name: string;
    color: string;
  }>;
  html_url: string;
}

export interface CommitActivityWeek {
  week: number;
  total: number;
  days: number[];
}

export interface RepoAnalytics {
  repo: GitHubRepo;
  contributors: GitHubContributor[];
  recentCommits: GitHubCommit[];
  issues: GitHubIssue[];
  commitActivity: CommitActivityWeek[];
  languages: Record<string, number>;
}

export interface ApiResponse {
  success: boolean;
  data: RepoAnalytics;
  timestamp: string;
}

export interface LanguageData {
  name: string;
  value: number;
  percentage: string;
  color: string;
}

export interface CommitActivityData {
  week: string;
  commits: number;
  date: string;
}

export interface IssueStats {
  open: number;
  closed: number;
  total: number;
}

export interface LabelCount {
  name: string;
  count: number;
}