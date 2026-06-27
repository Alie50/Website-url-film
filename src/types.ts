export type VideoType = 'auto' | 'direct' | 'youtube' | 'vimeo' | 'iframe';

export interface Episode {
  id: string;
  episodeNumber: number;
  seasonNumber: number;
  title: string;
  videoUrl: string;
  videoType: VideoType;
  createdAt: string;
}

export interface MediaItem {
  id: string;
  type: 'movie' | 'series';
  title: string;
  description: string;
  posterUrl: string;
  videoUrl?: string; // used for movies
  videoType?: VideoType; // used for movies
  episodes?: Episode[]; // used for series
  section?: string; // e.g., 'أفلام' | 'أنمي' | 'أنميشن' | 'مسلسلات'
  category?: string; // e.g., 'أكشن' | 'رعب' etc.
  createdAt: string;
}

export interface ShareToken {
  id: string; // unique token string
  itemId: string; // ID of movie or series
  episodeId?: string; // specific episode ID for series
  title: string; // friendly custom title for the link
  createdAt: string;
  expiresAt: string | null;
  views: number;
  maxViews: number | null;
  isActive: boolean;
}

export interface DashboardStats {
  totalItems: number;
  totalTokens: number;
  totalViews: number;
}
