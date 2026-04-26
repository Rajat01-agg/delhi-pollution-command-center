export interface SocialPost {
  id: string;
  content: string;
  platforms: ('twitter' | 'instagram' | 'whatsapp')[];
  timestamp: number;
  reason: string;
  location?: string;
  metrics?: {
    shares: number;
    views: number;
  };
}

const POST_HISTORY_KEY = 'social_media_post_history';

export const savePost = (post: Omit<SocialPost, 'id' | 'timestamp'>): SocialPost => {
  const newPost: SocialPost = {
    ...post,
    id: `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: Date.now(),
  };

  const history = getPostHistory();
  history.unshift(newPost);
  
  // Keep only last 100 posts
  const trimmedHistory = history.slice(0, 100);
  localStorage.setItem(POST_HISTORY_KEY, JSON.stringify(trimmedHistory));
  
  return newPost;
};

export const getPostHistory = (): SocialPost[] => {
  try {
    const stored = localStorage.getItem(POST_HISTORY_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error loading post history:', error);
    return [];
  }
};

export const getRelativeTime = (timestamp: number): string => {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export const clearPostHistory = () => {
  localStorage.removeItem(POST_HISTORY_KEY);
};

// Initialize with sample data if empty
export const initializeSampleData = () => {
  const history = getPostHistory();
  if (history.length === 0) {
    // Add the sample post from the UI
    savePost({
      content: '🚨 SEVERE POLLUTION ALERT: ROHINI\nAQI has crossed critical levels (412). GRAP-4 measures enforced.\n⚠️ Schools closed.\n⚠️ Construction halted.\nMask up and stay indoors! #DelhiPollution #HealthEmergency',
      platforms: ['twitter', 'instagram'],
      reason: 'GRAP-4 Emergency Alert',
      location: 'Rohini',
      metrics: {
        shares: 143,
        views: 2500,
      },
    });
  }
};
