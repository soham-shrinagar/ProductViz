import React, { useState } from 'react';
import { Github, Star, GitFork, Eye, AlertCircle, Users, Code, Activity, Calendar, ExternalLink, Search, Loader, BarChart3 } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

import type {GitHubContributor, GitHubCommit, GitHubIssue, CommitActivityWeek, RepoAnalytics, ApiResponse, LanguageData ,CommitActivityData, IssueStats, LabelCount
} from '../types/types';

const ProductViz: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [analytics, setAnalytics] = useState<RepoAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const API_BASE = 'http://localhost:5000/api/github';

  const analyzeRepository = async (): Promise<void> => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    setLoading(true);
    setError('');
    setAnalytics(null);

    try {
      const response = await fetch(`${API_BASE}/analyze-url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: repoUrl.trim() }),
      });

      const data: ApiResponse | { success: false; error: string } = await response.json();

      if (!response.ok || !data.success) {
        throw new Error('error' in data ? data.error : 'Failed to analyze repository');
      }

      setAnalytics(data.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    const numValue = Math.max(0, num); // Ensure non-negative
    if (numValue >= 1000000) return `${(numValue / 1000000).toFixed(1)}M`;
    if (numValue >= 1000) return `${(numValue / 1000).toFixed(1)}K`;
    return numValue.toString();
  };

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getLanguageColors = (): Record<string, string> => ({
    JavaScript: '#f1e05a',
    TypeScript: '#2b7489',
    Python: '#3572A5',
    Java: '#b07219',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#239120',
    PHP: '#4F5D95',
    Ruby: '#701516',
    Go: '#00ADD8',
    Rust: '#dea584',
    Swift: '#ffac45',
    Kotlin: '#F18E33',
    Scala: '#c22d40',
    Shell: '#89e051',
    HTML: '#e34c26',
    CSS: '#1572B6',
    Vue: '#2c3e50',
    React: '#61dafb'
  });

  const prepareLanguageData = (): LanguageData[] => {
    if (!analytics?.languages || Object.keys(analytics.languages).length === 0) return [];
    
    const colors = getLanguageColors();
    const total = Object.values(analytics.languages).reduce((sum: number, bytes: number) => sum + bytes, 0);
    
    if (total === 0) return [];
    
    return Object.entries(analytics.languages)
      .filter(([_, bytes]) => bytes > 0)
      .map(([lang, bytes]: [string, number]) => ({
        name: lang,
        value: bytes,
        percentage: ((bytes / total) * 100).toFixed(1),
        color: colors[lang] || '#8884d8'
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 languages
  };

  const prepareCommitActivityData = (): CommitActivityData[] => {
    if (!analytics?.commitActivity || !Array.isArray(analytics.commitActivity)) return [];
    
    return analytics.commitActivity
      .filter((week: CommitActivityWeek) => week && typeof week.week === 'number' && typeof week.total === 'number')
      .map((week: CommitActivityWeek, index: number) => ({
        week: `Week ${index + 1}`,
        commits: Math.max(0, week.total), // Ensure non-negative
        date: new Date(week.week * 1000).toLocaleDateString()
      }))
      .slice(-12); // Last 12 weeks
  };

  const getIssueStats = (): IssueStats => {
    if (!analytics?.issues || !Array.isArray(analytics.issues)) return { open: 0, closed: 0, total: 0 };
    
    const validIssues = analytics.issues.filter((issue: GitHubIssue) => 
      issue && typeof issue.state === 'string'
    );
    
    const open = validIssues.filter((issue: GitHubIssue) => issue.state === 'open').length;
    const closed = validIssues.filter((issue: GitHubIssue) => issue.state === 'closed').length;
    
    return { open, closed, total: open + closed };
  };

  const getTopLabels = (): LabelCount[] => {
    if (!analytics?.issues || !Array.isArray(analytics.issues)) return [];
    
    const labelCount: Record<string, number> = {};
    analytics.issues.forEach((issue: GitHubIssue) => {
      if (issue && Array.isArray(issue.labels)) {
        issue.labels.forEach((label: { name: string; color: string }) => {
          if (label && label.name) {
            labelCount[label.name] = (labelCount[label.name] || 0) + 1;
          }
        });
      }
    });
    
    return Object.entries(labelCount)
      .map(([name, count]: [string, number]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      analyzeRepository();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setRepoUrl(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">ProductViz</h1>
              <p className="text-gray-300">GitHub Repository Analytics Dashboard</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* URL Input Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Analyze Any GitHub Repository</h2>
            <p className="text-gray-300">Paste a GitHub repository URL to get detailed analytics and insights</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="url"
                value={repoUrl}
                onChange={handleInputChange}
                placeholder="https://github.com/owner/repository"
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                onKeyPress={handleKeyPress}
              />
            </div>
            <button
              onClick={analyzeRepository}
              disabled={loading}
              className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
              {loading ? 'Analyzing...' : 'Analyze'}
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Analytics Dashboard */}
        {analytics && (
          <div className="space-y-8">
            {/* Repository Overview */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">{analytics.repo.full_name}</h2>
                  <p className="text-gray-300 mb-4">{analytics.repo.description || 'No description provided'}</p>
                  <div className="flex flex-wrap gap-2">
                    {analytics.repo.language && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                        {analytics.repo.language}
                      </span>
                    )}
                    {analytics.repo.license && (
                      <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                        {analytics.repo.license.name}
                      </span>
                    )}
                  </div>
                </div>
                <a
                  href={analytics.repo.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on GitHub
                </a>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <Star className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{formatNumber(analytics.repo.stargazers_count)}</div>
                  <div className="text-gray-400 text-sm">Stars</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <GitFork className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{formatNumber(analytics.repo.forks_count)}</div>
                  <div className="text-gray-400 text-sm">Forks</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <Eye className="w-6 h-6 text-green-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{formatNumber(analytics.repo.watchers_count)}</div>
                  <div className="text-gray-400 text-sm">Watchers</div>
                </div>
                <div className="bg-black/20 rounded-lg p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-white">{analytics.repo.open_issues_count}</div>
                  <div className="text-gray-400 text-sm">Open Issues</div>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Language Distribution */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5" />
                  Language Distribution
                </h3>
                {prepareLanguageData().length > 0 ? (
                  <div className="flex flex-col lg:flex-row items-center gap-4">
                    <div className="w-full lg:w-2/3">
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                          //@ts-ignore
                            data={prepareLanguageData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {prepareLanguageData().map((entry: LanguageData, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number, name: string) => [formatNumber(value), name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="space-y-2">
                      {prepareLanguageData().map((lang: LanguageData, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: lang.color }}
                          />
                          <span className="text-gray-300 text-sm">
                            {lang.name} ({lang.percentage}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-8">No language data available</p>
                )}
              </div>

              {/* Commit Activity */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Commit Activity (Last 12 Weeks)
                </h3>
                {prepareCommitActivityData().length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={prepareCommitActivityData()}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="week" 
                        stroke="#9CA3AF" 
                        fontSize={12}
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <YAxis 
                        stroke="#9CA3AF" 
                        fontSize={12}
                        tick={{ fill: '#9CA3AF' }}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="commits" 
                        stroke="#8B5CF6" 
                        fill="url(#colorGradient)" 
                      />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-gray-400 text-center py-8">No commit activity data available</p>
                )}
              </div>
            </div>

            {/* Contributors & Issues */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Contributors */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Top Contributors
                </h3>
                <div className="space-y-3">
                  {analytics.contributors && Array.isArray(analytics.contributors) && analytics.contributors.length > 0 ? (
                    analytics.contributors.slice(0, 5).map((contributor: GitHubContributor, index: number) => (
                      <div key={contributor.id || index} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                        {contributor.avatar_url && (
                          <img 
                            src={contributor.avatar_url} 
                            alt={contributor.login || 'Contributor'}
                            className="w-10 h-10 rounded-full border-2 border-purple-500"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-white">{contributor.login || 'Unknown'}</div>
                          <div className="text-sm text-gray-400">
                            {formatNumber(contributor.contributions || 0)} contributions
                          </div>
                        </div>
                        <div className="text-sm font-medium text-purple-400">#{index + 1}</div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-8">No contributors data available</p>
                  )}
                </div>
              </div>

              {/* Issue Statistics */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Issue Statistics
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{getIssueStats().closed}</div>
                      <div className="text-sm text-gray-400">Closed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{getIssueStats().open}</div>
                      <div className="text-sm text-gray-400">Open</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{getIssueStats().total}</div>
                      <div className="text-sm text-gray-400">Total</div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-white mb-2">Top Issue Labels</h4>
                    <div className="space-y-2">
                      {getTopLabels().map((label: LabelCount, index: number) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="text-gray-300">{label.name}</span>
                          <span className="text-purple-400 font-medium">{label.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Commits */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Recent Commits
              </h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analytics.recentCommits && Array.isArray(analytics.recentCommits) && analytics.recentCommits.length > 0 ? (
                  analytics.recentCommits.slice(0, 10).map((commit: GitHubCommit) => (
                    <div key={commit.sha || Math.random()} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                      {commit.author && commit.author.avatar_url && (
                        <img 
                          src={commit.author.avatar_url} 
                          alt={commit.author.login || 'Author'}
                          className="w-8 h-8 rounded-full mt-1"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">
                          {commit.commit?.message ? commit.commit.message.split('\n')[0] : 'No commit message'}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                          <span>{commit.commit?.author?.name || 'Unknown author'}</span>
                          <span>•</span>
                          <span>{formatDate(commit.commit?.author?.date)}</span>
                          {commit.html_url && (
                            <a 
                              href={commit.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-auto text-purple-400 hover:text-purple-300 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No recent commits available</p>
                )}
              </div>
            </div>

            {/* Repository Details */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold text-white mb-4">Repository Details</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <div className="text-gray-400 text-sm">Created</div>
                  <div className="text-white font-medium">{formatDate(analytics.repo.created_at)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Last Updated</div>
                  <div className="text-white font-medium">{formatDate(analytics.repo.updated_at)}</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Size</div>
                  <div className="text-white font-medium">{formatNumber(analytics.repo.size)} KB</div>
                </div>
                <div>
                  <div className="text-gray-400 text-sm">Default Branch</div>
                  <div className="text-white font-medium">{analytics.repo.default_branch}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400">
          <p>ProductViz Dashboard</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductViz;