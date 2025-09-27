import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { githubRoutes } from './routes/github';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './middleware/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX || '100'), // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: "*",   // allow all origins
  credentials: false // credentials (cookies/auth headers) are not allowed when origin is '*'
}));
app.use(express.json());
app.use(limiter);
app.use(logger);

// Routes
app.use('/api/github', githubRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 ProductViz Backend ready!`);
});

// src/types/github.ts
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

export interface RepoAnalytics {
  repo: GitHubRepo;
  contributors: GitHubContributor[];
  recentCommits: GitHubCommit[];
  issues: GitHubIssue[];
  commitActivity: Array<{
    week: number;
    total: number;
    days: number[];
  }>;
  languages: Record<string, number>;
}