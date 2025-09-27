import axios, { AxiosResponse } from 'axios';
import NodeCache from 'node-cache';
import { GitHubRepo, GitHubContributor, GitHubCommit, GitHubIssue, RepoAnalytics } from '../types/github';

class GitHubService {
  private cache: NodeCache;
  private baseURL = 'https://api.github.com';
  private token: string;

  constructor() {
    // Cache for 10 minutes
    this.cache = new NodeCache({ stdTTL: 600 });
    this.token = process.env.GITHUB_TOKEN || '';
  }

  private getHeaders() {
    return {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'ProductViz-Dashboard',
      ...(this.token && { 'Authorization': `token ${this.token}` })
    };
  }

  async getRepoInfo(owner: string, repo: string): Promise<GitHubRepo> {
    const cacheKey = `repo:${owner}/${repo}`;
    const cached = this.cache.get<GitHubRepo>(cacheKey);
    if (cached) return cached;

    try {
      const response: AxiosResponse<GitHubRepo> = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}`,
        { headers: this.getHeaders() }
      );

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch repository: ${error}`);
    }
  }

  async getContributors(owner: string, repo: string): Promise<GitHubContributor[]> {
    const cacheKey = `contributors:${owner}/${repo}`;
    const cached = this.cache.get<GitHubContributor[]>(cacheKey);
    if (cached) return cached;

    try {
      const response: AxiosResponse<GitHubContributor[]> = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/contributors?per_page=30`,
        { headers: this.getHeaders() }
      );

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch contributors: ${error}`);
    }
  }

  async getCommits(owner: string, repo: string): Promise<GitHubCommit[]> {
    const cacheKey = `commits:${owner}/${repo}`;
    const cached = this.cache.get<GitHubCommit[]>(cacheKey);
    if (cached) return cached;

    try {
      const response: AxiosResponse<GitHubCommit[]> = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/commits?per_page=50`,
        { headers: this.getHeaders() }
      );

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch commits: ${error}`);
    }
  }

  async getIssues(owner: string, repo: string): Promise<GitHubIssue[]> {
    const cacheKey = `issues:${owner}/${repo}`;
    const cached = this.cache.get<GitHubIssue[]>(cacheKey);
    if (cached) return cached;

    try {
      const [openIssues, closedIssues] = await Promise.all([
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/issues?state=open&per_page=50`, {
          headers: this.getHeaders()
        }),
        axios.get(`${this.baseURL}/repos/${owner}/${repo}/issues?state=closed&per_page=50`, {
          headers: this.getHeaders()
        })
      ]);

      const allIssues = [...openIssues.data, ...closedIssues.data];
      this.cache.set(cacheKey, allIssues);
      return allIssues;
    } catch (error) {
      throw new Error(`Failed to fetch issues: ${error}`);
    }
  }

  async getCommitActivity(owner: string, repo: string) {
    const cacheKey = `activity:${owner}/${repo}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/stats/commit_activity`,
        { headers: this.getHeaders() }
      );

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch commit activity: ${error}`);
    }
  }

  async getLanguages(owner: string, repo: string) {
    const cacheKey = `languages:${owner}/${repo}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${this.baseURL}/repos/${owner}/${repo}/languages`,
        { headers: this.getHeaders() }
      );

      this.cache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch languages: ${error}`);
    }
  }

  async getFullAnalytics(owner: string, repo: string): Promise<RepoAnalytics> {
    try {
      const [
        repoInfo,
        contributors,
        commits,
        issues,
        commitActivity,
        languages
      ] = await Promise.all([
        this.getRepoInfo(owner, repo),
        this.getContributors(owner, repo),
        this.getCommits(owner, repo),
        this.getIssues(owner, repo),
        this.getCommitActivity(owner, repo),
        this.getLanguages(owner, repo)
      ]);

      return {
        repo: repoInfo,
        contributors,
        recentCommits: commits,
        issues,
        commitActivity,
        languages
      };
    } catch (error) {
      throw new Error(`Failed to fetch full analytics: ${error}`);
    }
  }
}

export const githubService = new GitHubService();