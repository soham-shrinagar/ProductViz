# ProductViz

A GitHub repository analytics dashboard that simplifies repository analysis and provides useful insights with a clean user interface.

---

## Overview

ProductViz analyzes any public GitHub repository and displays comprehensive analytics including stars, forks, watchers, open issues, language distribution, commit activity, top contributors, issue statistics, recent commits, and repository details.

---

## Features

- **Repository Analytics**: View stars, forks, watchers, and open issues at a glance
- **Language Distribution**: Visual breakdown of programming languages used
- **Commit Activity**: Track commit patterns over the last 12 weeks
- **Top Contributors**: See the most active contributors and their contribution counts
- **Issue Statistics**: Monitor open, closed, and total issues with top issue labels
- **Recent Commits**: Browse the latest commits with author details
- **Repository Details**: Access creation date, last update, size, and default branch info
- **Rate Limiting**: Built-in API rate limiting for stable performance
- **Caching**: Fast response times with intelligent caching

---

## Tech Stack

**Frontend:**
- React
- TypeScript

**Backend:**
- Node.js + Express
- TypeScript
- Axios for GitHub API integration
- Node-cache for caching
- Helmet for security

---

## Project Setup

### Prerequisites

- Node.js (v16 or higher)
- GitHub Personal Access Token

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.example .env
```

Update `.env` with your configuration:

```env
PORT=
NODE_ENV=
GITHUB_TOKEN=your_github_personal_access_token_here
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

4. Start the backend server:

```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm start
```

4. Open your browser and visit `http://localhost:3000`

---

## Usage

1. Enter any GitHub repository URL (e.g., `https://github.com/facebook/react`)
2. Click the "Analyze" button
3. View comprehensive analytics and insights about the repository

---


## Getting a GitHub Token

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `public_repo` scope
3. Copy the token and add it to your `.env` file

---
