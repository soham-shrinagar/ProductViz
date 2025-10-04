import React, { useState, useRef } from 'react';
import { Github, Star, GitFork, Eye, AlertCircle, Users, Code, Activity, Calendar, ExternalLink, Search, Loader, BarChart3, GitCompare, HeartPulse, TrendingUp, CheckCircle, XCircle, AlertTriangle, Download } from 'lucide-react';
import { AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

import type { RepoAnalytics, ApiResponse } from '../types/types';

type ViewMode = 'single' | 'compare' | 'health';

interface HealthMetrics {
  score: number;
  grade: string;
  color: string;
  metrics: {
    activity: number;
    maintenance: number;
    community: number;
    documentation: number;
    stability: number;
  };
  recommendations: string[];
}

const ProductViz: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('single');
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [repoUrl2, setRepoUrl2] = useState<string>('');
  const [analytics, setAnalytics] = useState<RepoAnalytics | null>(null);
  const [analytics2, setAnalytics2] = useState<RepoAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const compareRef = useRef<HTMLDivElement>(null);
  const healthRef = useRef<HTMLDivElement>(null);

  const API_BASE = 'http://localhost:5000/api/github';

  const analyzeRepository = async (url: string, setData: (data: RepoAnalytics) => void): Promise<void> => {
    const response = await fetch(`${API_BASE}/analyze-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url.trim() }),
    });

    const data: ApiResponse | { success: false; error: string } = await response.json();
    if (!response.ok || !data.success) {
      throw new Error('error' in data ? data.error : 'Failed to analyze repository');
    }
    setData(data.data);
  };

  const handleAnalyze = async (): Promise<void> => {
    if (!repoUrl.trim()) {
      setError('Please enter a GitHub repository URL');
      return;
    }

    if (viewMode === 'compare' && !repoUrl2.trim()) {
      setError('Please enter both repository URLs for comparison');
      return;
    }

    setLoading(true);
    setError('');
    setAnalytics(null);
    setAnalytics2(null);

    try {
      if (viewMode === 'compare') {
        await Promise.all([
          analyzeRepository(repoUrl, setAnalytics),
          analyzeRepository(repoUrl2, setAnalytics2)
        ]);
      } else {
        await analyzeRepository(repoUrl, setAnalytics);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Something went wrong';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const calculateHealthScore = (data: RepoAnalytics): HealthMetrics => {
    // Activity Score (based on recent commits)
    let recentCommits = 0;
    if (data.commitActivity && Array.isArray(data.commitActivity) && data.commitActivity.length > 0) {
      try {
        recentCommits = data.commitActivity
          .slice(-4)
          .filter(week => week && typeof week.total === 'number')
          .reduce((sum, week) => sum + week.total, 0);
      } catch (e) {
        recentCommits = 0;
      }
    }
    const activityScore = Math.min(100, (recentCommits / 50) * 100);

    // Maintenance Score (based on open issues ratio)
    const closedIssues = data.issues && Array.isArray(data.issues) 
      ? data.issues.filter(i => i && i.state === 'closed').length 
      : 0;
    const totalIssues = (data.repo.open_issues_count || 0) + closedIssues;
    const issueRatio = totalIssues > 0 ? closedIssues / totalIssues : 0.5;
    const maintenanceScore = issueRatio * 100;

    // Community Score (based on contributors and stars)
    const contributorCount = data.contributors && Array.isArray(data.contributors) 
      ? data.contributors.length 
      : 0;
    const contributorScore = Math.min(100, (contributorCount / 20) * 100);
    const starScore = Math.min(100, ((data.repo.stargazers_count || 0) / 1000) * 100);
    const communityScore = (contributorScore + starScore) / 2;

    // Documentation Score (has README, description, license)
    let docScore = 0;
    if (data.repo.description) docScore += 40;
    if (data.repo.license) docScore += 30;
    docScore += 30; // Assume README exists
    const documentationScore = docScore;

    // Stability Score (based on repo age and update frequency)
    let ageScore = 50;
    let freshnessScore = 50;
    try {
      const createdDate = new Date(data.repo.created_at);
      const ageInDays = (Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
      ageScore = Math.min(100, (ageInDays / 365) * 50);
      
      const lastUpdate = new Date(data.repo.updated_at);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      freshnessScore = Math.max(0, 100 - (daysSinceUpdate / 30) * 50);
    } catch (e) {
      // Use default scores if date parsing fails
      ageScore = 50;
      freshnessScore = 50;
    }
    const stabilityScore = (ageScore + freshnessScore) / 2;

    // Overall Score
    const overallScore = Math.round(
      (activityScore * 0.25 + maintenanceScore * 0.25 + communityScore * 0.2 + documentationScore * 0.15 + stabilityScore * 0.15)
    );

    // Grade and Color
    let grade = 'F';
    let color = '#EF4444';
    if (overallScore >= 90) { grade = 'A+'; color = '#10B981'; }
    else if (overallScore >= 80) { grade = 'A'; color = '#34D399'; }
    else if (overallScore >= 70) { grade = 'B'; color = '#FBBF24'; }
    else if (overallScore >= 60) { grade = 'C'; color = '#F59E0B'; }
    else if (overallScore >= 50) { grade = 'D'; color = '#F97316'; }

    // Recommendations
    const recommendations: string[] = [];
    if (activityScore < 50) recommendations.push('Increase commit frequency to show active development');
    if (maintenanceScore < 60) recommendations.push('Address open issues to improve maintenance score');
    if (communityScore < 50) recommendations.push('Encourage more contributors and engagement');
    if (documentationScore < 70) recommendations.push('Improve documentation with detailed README and proper license');
    if (stabilityScore < 60) recommendations.push('Update repository more regularly to maintain stability');

    return {
      score: overallScore,
      grade,
      color,
      metrics: {
        activity: Math.round(activityScore),
        maintenance: Math.round(maintenanceScore),
        community: Math.round(communityScore),
        documentation: Math.round(documentationScore),
        stability: Math.round(stabilityScore)
      },
      recommendations
    };
  };

  const formatNumber = (num: number | undefined | null): string => {
    if (num === undefined || num === null || isNaN(num)) return '0';
    const numValue = Math.max(0, num);
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
    JavaScript: '#f1e05a', TypeScript: '#2b7489', Python: '#3572A5', Java: '#b07219',
    'C++': '#f34b7d', C: '#555555', 'C#': '#239120', PHP: '#4F5D95', Ruby: '#701516',
    Go: '#00ADD8', Rust: '#dea584', Swift: '#ffac45', Kotlin: '#F18E33', Scala: '#c22d40',
    Shell: '#89e051', HTML: '#e34c26', CSS: '#1572B6', Vue: '#2c3e50', React: '#61dafb'
  });

  const prepareComparisonData = () => {
    if (!analytics || !analytics2) return [];
    return [
      { metric: 'Stars', repo1: analytics.repo.stargazers_count, repo2: analytics2.repo.stargazers_count },
      { metric: 'Forks', repo1: analytics.repo.forks_count, repo2: analytics2.repo.forks_count },
      { metric: 'Contributors', repo1: analytics.contributors.length, repo2: analytics2.contributors.length },
      { metric: 'Open Issues', repo1: analytics.repo.open_issues_count, repo2: analytics2.repo.open_issues_count },
      { metric: 'Watchers', repo1: analytics.repo.watchers_count, repo2: analytics2.repo.watchers_count },
    ];
  };

  const prepareHealthRadarData = (health: HealthMetrics) => {
    return [
      { subject: 'Activity', value: health.metrics.activity, fullMark: 100 },
      { subject: 'Maintenance', value: health.metrics.maintenance, fullMark: 100 },
      { subject: 'Community', value: health.metrics.community, fullMark: 100 },
      { subject: 'Documentation', value: health.metrics.documentation, fullMark: 100 },
      { subject: 'Stability', value: health.metrics.stability, fullMark: 100 },
    ];
  };

  const exportToHTML = (mode: 'compare' | 'health') => {
    try {
      const element = mode === 'compare' ? compareRef.current : healthRef.current;
      if (!element) return;

      // Clone the element and wrap in complete HTML
      const clone = element.cloneNode(true) as HTMLElement;
      
      const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ProductViz ${mode === 'compare' ? 'Comparison' : 'Health'} Report</title>
  <style>
    body { 
      margin: 0; 
      padding: 20px; 
      background: linear-gradient(to bottom right, #0f172a, #581c87, #0f172a);
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
    }
    @media print {
      body { background: white; }
      button { display: none !important; }
    }
  </style>
</head>
<body>
  ${clone.outerHTML}
  <script>
    // Auto-print on load for PDF generation
    if (window.location.search.includes('print=true')) {
      window.print();
    }
  </script>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const timestamp = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = mode === 'compare' 
        ? `ProductViz_Comparison_${timestamp}.html`
        : `ProductViz_Health_Report_${timestamp}.html`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('Report downloaded! Open the HTML file and use your browser\'s Print > Save as PDF option for a PDF version.');
    } catch (error) {
      console.error('Export failed:', error);
      setError('Failed to export report. Please try again.');
    }
  };

  const downloadJSON = (mode: 'compare' | 'health') => {
    try {
      let data: any;
      let filename: string;
      
      if (mode === 'compare' && analytics && analytics2) {
        data = {
          repository1: {
            name: analytics.repo.full_name,
            stars: analytics.repo.stargazers_count,
            forks: analytics.repo.forks_count,
            contributors: analytics.contributors.length,
            openIssues: analytics.repo.open_issues_count,
          },
          repository2: {
            name: analytics2.repo.full_name,
            stars: analytics2.repo.stargazers_count,
            forks: analytics2.repo.forks_count,
            contributors: analytics2.contributors.length,
            openIssues: analytics2.repo.open_issues_count,
          },
          comparedAt: new Date().toISOString(),
        };
        filename = `comparison_${Date.now()}.json`;
      } else if (mode === 'health' && analytics) {
        const health = calculateHealthScore(analytics);
        data = {
          repository: analytics.repo.full_name,
          healthScore: health.score,
          grade: health.grade,
          metrics: health.metrics,
          recommendations: health.recommendations,
          analyzedAt: new Date().toISOString(),
        };
        filename = `health_report_${Date.now()}.json`;
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      //@ts-ignore
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download report. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">ProductViz</h1>
                <p className="text-gray-300">GitHub Repository Analytics Dashboard</p>
              </div>
            </div>
            
            {/* Mode Selector */}
            <div className="flex gap-2 bg-black/30 rounded-lg p-1">
              <button
                onClick={() => setViewMode('single')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  viewMode === 'single' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Single
              </button>
              <button
                onClick={() => setViewMode('compare')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  viewMode === 'compare' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                <GitCompare className="w-4 h-4" />
                Compare
              </button>
              <button
                onClick={() => setViewMode('health')}
                className={`px-4 py-2 rounded-md flex items-center gap-2 transition-all ${
                  viewMode === 'health' ? 'bg-purple-500 text-white' : 'text-gray-300 hover:text-white'
                }`}
              >
                <HeartPulse className="w-4 h-4" />
                Health
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* URL Input Section */}
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 mb-8 border border-white/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {viewMode === 'compare' ? 'Compare Two Repositories' : 
               viewMode === 'health' ? 'Repository Health Analysis' : 
               'Analyze GitHub Repository'}
            </h2>
            <p className="text-gray-300">
              {viewMode === 'compare' ? 'Enter two repository URLs to compare side-by-side' :
               viewMode === 'health' ? 'Get comprehensive health metrics and recommendations' :
               'Paste a GitHub repository URL to get detailed analytics'}
            </p>
          </div>
          
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="url"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder={viewMode === 'compare' ? 'Repository 1 URL' : 'https://github.com/owner/repository'}
                  className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                />
              </div>
              {viewMode !== 'compare' && (
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              )}
            </div>

            {viewMode === 'compare' && (
              <>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="url"
                      value={repoUrl2}
                      onChange={(e) => setRepoUrl2(e.target.value)}
                      placeholder="Repository 2 URL"
                      className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                    />
                  </div>
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={loading}
                  className="w-full px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader className="w-5 h-5 animate-spin" /> : <GitCompare className="w-5 h-5" />}
                  {loading ? 'Comparing...' : 'Compare Repositories'}
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Comparison View */}
        {viewMode === 'compare' && analytics && analytics2 && (
          <div ref={compareRef} className="space-y-8">
            {/* Export Button */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => downloadJSON('compare')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => exportToHTML('compare')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <GitCompare className="w-6 h-6" />
                Repository Comparison
              </h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="text-xl font-bold text-purple-400 mb-2">{analytics.repo.full_name}</h4>
                  <p className="text-gray-300 text-sm">{analytics.repo.description || 'No description'}</p>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <h4 className="text-xl font-bold text-pink-400 mb-2">{analytics2.repo.full_name}</h4>
                  <p className="text-gray-300 text-sm">{analytics2.repo.description || 'No description'}</p>
                </div>
              </div>

              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={prepareComparisonData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="metric" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                  <Legend />
                  <Bar dataKey="repo1" fill="#8B5CF6" name={analytics.repo.name} />
                  <Bar dataKey="repo2" fill="#EC4899" name={analytics2.repo.name} />
                </BarChart>
              </ResponsiveContainer>

              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mt-8">
                {prepareComparisonData().map((item, idx) => (
                  <div key={idx} className="bg-black/20 rounded-lg p-4 text-center">
                    <div className="text-gray-400 text-sm mb-2">{item.metric}</div>
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400 font-bold">{formatNumber(item.repo1)}</span>
                      <span className="text-gray-500">vs</span>
                      <span className="text-pink-400 font-bold">{formatNumber(item.repo2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Health View */}
        {viewMode === 'health' && analytics && (
          <div ref={healthRef} className="space-y-8">
            {/* Export Button */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => downloadJSON('health')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export JSON
              </button>
              <button
                onClick={() => exportToHTML('health')}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Report
              </button>
            </div>

            {(() => {
              const health = calculateHealthScore(analytics);
              return (
                <>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
                      <div className="text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-white mb-2">{analytics.repo.full_name}</h2>
                        <p className="text-gray-300 mb-4">Repository Health Analysis</p>
                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <div className="text-6xl font-bold" style={{ color: health.color }}>{health.score}</div>
                            <div className="text-gray-400">Health Score</div>
                          </div>
                          <div className="text-center">
                            <div className="text-6xl font-bold" style={{ color: health.color }}>{health.grade}</div>
                            <div className="text-gray-400">Grade</div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="w-full lg:w-1/2">
                        <ResponsiveContainer width="100%" height={300}>
                          <RadarChart data={prepareHealthRadarData(health)}>
                            <PolarGrid stroke="#374151" />
                            <PolarAngleAxis dataKey="subject" stroke="#9CA3AF" />
                            <PolarRadiusAxis stroke="#9CA3AF" />
                            <Radar name="Health Metrics" dataKey="value" stroke={health.color} fill={health.color} fillOpacity={0.6} />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                    {Object.entries(health.metrics).map(([key, value]) => (
                      <div key={key} className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                        <div className="text-gray-400 text-sm mb-2 capitalize">{key}</div>
                        <div className="flex items-center gap-2">
                          <div className="text-3xl font-bold text-white">{value}</div>
                          {value >= 80 ? <CheckCircle className="w-5 h-5 text-green-400" /> :
                           value >= 50 ? <AlertTriangle className="w-5 h-5 text-yellow-400" /> :
                           <XCircle className="w-5 h-5 text-red-400" />}
                        </div>
                        <div className="mt-2 bg-gray-700 rounded-full h-2">
                          <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${value}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {health.recommendations.length > 0 && (
                    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Recommendations for Improvement
                      </h3>
                      <div className="space-y-3">
                        {health.recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-300">{rec}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Single View - Complete Original Dashboard */}
        {viewMode === 'single' && analytics && (
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
                <a href={analytics.repo.html_url} target="_blank" rel="noopener noreferrer" 
                   className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
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
                {(() => {
                  const langData = analytics?.languages && Object.keys(analytics.languages).length > 0
                    ? Object.entries(analytics.languages)
                        .filter(([_, bytes]) => bytes > 0)
                        .map(([lang, bytes]) => {
                          const colors = getLanguageColors();
                          const total = Object.values(analytics.languages).reduce((sum, b) => sum + b, 0);
                          return {
                            name: lang,
                            value: bytes,
                            percentage: ((bytes / total) * 100).toFixed(1),
                            color: colors[lang] || '#8884d8'
                          };
                        })
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 6)
                    : [];

                  return langData.length > 0 ? (
                    <div className="flex flex-col lg:flex-row items-center gap-4">
                      <div className="w-full lg:w-2/3">
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={langData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={90}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {langData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value: number) => formatNumber(value)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="space-y-2">
                        {langData.map((lang, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: lang.color }} />
                            <span className="text-gray-300 text-sm">
                              {lang.name} ({lang.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No language data available</p>
                  );
                })()}
              </div>

              {/* Commit Activity */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Commit Activity (Last 12 Weeks)
                </h3>
                {(() => {
                  const commitData = analytics?.commitActivity && Array.isArray(analytics.commitActivity)
                    ? analytics.commitActivity
                        .filter(week => week && typeof week.week === 'number' && typeof week.total === 'number')
                        .map((week, index) => ({
                          week: `Week ${index + 1}`,
                          commits: Math.max(0, week.total),
                          date: new Date(week.week * 1000).toLocaleDateString()
                        }))
                        .slice(-12)
                    : [];

                  return commitData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={commitData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="week" stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
                        <YAxis stroke="#9CA3AF" fontSize={12} tick={{ fill: '#9CA3AF' }} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#F9FAFB' }} />
                        <Area type="monotone" dataKey="commits" stroke="#8B5CF6" fill="url(#colorGradient)" />
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No commit activity data available</p>
                  );
                })()}
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
                    analytics.contributors.slice(0, 5).map((contributor, index) => (
                      <div key={contributor.id || index} className="flex items-center gap-3 p-3 bg-black/20 rounded-lg">
                        {contributor.avatar_url && (
                          <img 
                            src={contributor.avatar_url} 
                            alt={contributor.login || 'Contributor'}
                            className="w-10 h-10 rounded-full border-2 border-purple-500"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-white">{contributor.login || 'Unknown'}</div>
                          <div className="text-sm text-gray-400">{formatNumber(contributor.contributions || 0)} contributions</div>
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
                {(() => {
                  const issueStats = analytics?.issues && Array.isArray(analytics.issues)
                    ? {
                        open: analytics.issues.filter(i => i && i.state === 'open').length,
                        closed: analytics.issues.filter(i => i && i.state === 'closed').length,
                        total: analytics.issues.filter(i => i && i.state).length
                      }
                    : { open: 0, closed: 0, total: 0 };

                  const topLabels = analytics?.issues && Array.isArray(analytics.issues)
                    ? Object.entries(
                        analytics.issues.reduce((acc, issue) => {
                          if (issue && Array.isArray(issue.labels)) {
                            issue.labels.forEach(label => {
                              if (label && label.name) {
                                acc[label.name] = (acc[label.name] || 0) + 1;
                              }
                            });
                          }
                          return acc;
                        }, {} as Record<string, number>)
                      )
                      .map(([name, count]) => ({ name, count }))
                      .sort((a, b) => b.count - a.count)
                      .slice(0, 5)
                    : [];

                  return (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">{issueStats.closed}</div>
                          <div className="text-sm text-gray-400">Closed</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-yellow-400">{issueStats.open}</div>
                          <div className="text-sm text-gray-400">Open</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-white">{issueStats.total}</div>
                          <div className="text-sm text-gray-400">Total</div>
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-2">Top Issue Labels</h4>
                        <div className="space-y-2">
                          {topLabels.map((label, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-gray-300">{label.name}</span>
                              <span className="text-purple-400 font-medium">{label.count}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
                  analytics.recentCommits.slice(0, 10).map((commit) => (
                    <div key={commit.sha || Math.random()} className="flex items-start gap-3 p-3 bg-black/20 rounded-lg hover:bg-black/30 transition-colors">
                      {commit.author && commit.author.avatar_url && (
                        <img 
                          src={commit.author.avatar_url} 
                          alt={commit.author.login || 'Author'}
                          className="w-8 h-8 rounded-full mt-1"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
                            <a href={commit.html_url} target="_blank" rel="noopener noreferrer" 
                               className="ml-auto text-purple-400 hover:text-purple-300 transition-colors">
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

      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400">
          <p>ProductViz Dashboard</p>
        </div>
      </footer>
    </div>
  );
};

export default ProductViz;