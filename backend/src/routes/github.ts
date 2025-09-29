import express from 'express';
import { z } from 'zod';
import { githubService } from '../services/githubService';
//@ts-ignore
import { validateRepoUrl } from '../utils/validation';

const router = express.Router();

const repoParamsSchema = z.object({
  owner: z.string().min(1),
  repo: z.string().min(1)
});

const repoUrlSchema = z.object({
  url: z.string().url()
});

// Full Repo Analysis
router.get('/analyze/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = repoParamsSchema.parse(req.params);
    
    const analytics = await githubService.getFullAnalytics(owner, repo);
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Analyze by URL
router.post('/analyze-url', async (req, res, next) => {
  try {
    const { url } = repoUrlSchema.parse(req.body);
    
    const { owner, repo } = validateRepoUrl(url);
    const analytics = await githubService.getFullAnalytics(owner, repo);
    
    res.json({
      success: true,
      data: analytics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
});

// Individual endpoints for specific data
router.get('/repo/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = repoParamsSchema.parse(req.params);
    const data = await githubService.getRepoInfo(owner, repo);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/contributors/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = repoParamsSchema.parse(req.params);
    const data = await githubService.getContributors(owner, repo);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/commits/:owner/:repo', async (req, res, next) => {
  try {
    const { owner, repo } = repoParamsSchema.parse(req.params);
    const data = await githubService.getCommits(owner, repo);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export { router as githubRoutes };
