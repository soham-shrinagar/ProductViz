export function validateRepoUrl(url: string): { owner: string; repo: string } {
  const regex = /^https:\/\/github\.com\/([^\/]+)\/([^\/]+?)(?:\/|\.git)?$/;
  const match = url.match(regex);
  
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }
  
  return {
    owner: match[1],
    repo: match[2]
  };
}