import React, { useState, useEffect, useRef } from 'react';
import { Play, RotateCcw, Volume2, VolumeX, Maximize2, ExternalLink, HelpCircle, Film } from 'lucide-react';
import { VideoType } from '../types';

interface CinemaPlayerProps {
  videoUrl: string;
  videoType: VideoType;
  title: string;
  posterUrl?: string;
}

export default function CinemaPlayer({ videoUrl, videoType, title, posterUrl }: CinemaPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isTheaterMode, setIsTheaterMode] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Auto-detect function based on URL content
  const detectVideoTypeFromUrl = (url: string, currentType: VideoType): VideoType => {
    if (currentType && currentType !== 'auto') return currentType;
    if (!url) return 'direct';

    const lower = url.toLowerCase().trim();

    // YouTube matches
    if (
      lower.includes('youtube.com') ||
      lower.includes('youtu.be') ||
      lower.includes('youtube-nocookie.com')
    ) {
      return 'youtube';
    }

    // Vimeo matches
    if (lower.includes('vimeo.com')) {
      return 'vimeo';
    }

    // Iframe/embed matches
    if (
      lower.includes('stmruby.com') ||
      lower.includes('drive.google.com') ||
      lower.includes('ok.ru') ||
      lower.includes('/embed/') ||
      lower.includes('embed-') ||
      lower.includes('iframe') ||
      lower.includes('gdrive') ||
      lower.includes('share') ||
      lower.includes('view') ||
      lower.includes('preview') ||
      lower.includes('.html') ||
      lower.includes('.htm') ||
      lower.includes('.php') ||
      lower.includes('player')
    ) {
      return 'iframe';
    }

    // Direct video extensions
    const videoExtensions = ['.mp4', '.m3u8', '.webm', '.ogg', '.mov', '.mkv', '.mpd'];
    if (videoExtensions.some(ext => lower.includes(ext) || lower.split('?')[0].endsWith(ext))) {
      return 'direct';
    }

    // Default to iframe for external unknown URLs, or direct if it looks like a clean stream
    return 'iframe';
  };

  const activeVideoType = detectVideoTypeFromUrl(videoUrl, videoType);

  // Helper to extract YouTube Video ID
  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    // Try extract from shorts or embed path
    const parts = url.split('/');
    const lastPart = parts[parts.length - 1];
    if (lastPart && lastPart.length === 11) {
      return lastPart;
    }
    return null;
  };

  // Helper to extract Vimeo Video ID
  const getVimeoId = (url: string): string | null => {
    if (!url) return null;
    const regExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)/;
    const match = url.match(regExp);
    return match ? match[1] : null;
  };

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => console.log('Autoplay blocked:', err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleMuteToggle = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  // Reset player state when source changes
  useEffect(() => {
    setIsPlaying(false);
  }, [videoUrl, activeVideoType]);

  const ytId = getYouTubeId(videoUrl);
  const vimId = getVimeoId(videoUrl);

  return (
    <div id="cinema-player-root" className={`w-full transition-all duration-500 ease-in-out ${isTheaterMode ? 'max-w-none' : 'max-w-4xl mx-auto'}`}>
      
      {/* Player Frame Wrapper */}
      <div 
        id="player-wrapper" 
        className="relative aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-[#050507]/90 group"
      >
        {/* Ambient background blur effect matching the movie */}
        {posterUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-center filter blur-3xl opacity-10 scale-105 pointer-events-none transition-all duration-1000"
            style={{ backgroundImage: `url(${posterUrl})` }}
          />
        )}

        {/* 1. Direct MP4 Video Player */}
        {activeVideoType === 'direct' && (
          <video
            id="html5-cinema-video"
            ref={videoRef}
            src={videoUrl}
            poster={posterUrl}
            className="w-full h-full object-contain relative z-10"
            onClick={handlePlayPause}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            controls
            referrerPolicy="no-referrer"
          />
        )}

        {/* 2. YouTube Embed Video Player */}
        {activeVideoType === 'youtube' && (
          <>
            {ytId ? (
              <iframe
                id="youtube-cinema-iframe"
                src={`https://www.youtube.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0`}
                title={title}
                className="w-full h-full relative z-10 border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                <HelpCircle className="w-12 h-12 text-zinc-600 mb-3" />
                <p className="text-zinc-400 font-medium">رابط يوتيوب غير صالح أو غير معترف به</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">{videoUrl}</p>
              </div>
            )}
          </>
        )}

        {/* 3. Vimeo Embed Video Player */}
        {activeVideoType === 'vimeo' && (
          <>
            {vimId ? (
              <iframe
                id="vimeo-cinema-iframe"
                src={`https://player.vimeo.com/video/${vimId}?autoplay=1&title=0&byline=0&portrait=0`}
                title={title}
                className="w-full h-full relative z-10 border-0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                <HelpCircle className="w-12 h-12 text-zinc-600 mb-3" />
                <p className="text-zinc-400 font-medium">رابط فيميو غير صالح أو غير معترف به</p>
                <p className="text-xs text-zinc-600 mt-1 max-w-xs">{videoUrl}</p>
              </div>
            )}
          </>
        )}

        {/* 4. Fallback Sandbox Iframe Embedding (For Google Drive stream, Okru, Upstream, etc.) */}
        {activeVideoType === 'iframe' && (
          <iframe
            id="generic-embed-cinema-iframe"
            src={videoUrl}
            title={title}
            className="w-full h-full relative z-10 border-0 bg-black"
            allowFullScreen
            allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
            {...(videoUrl.includes('stmruby.com') ? {} : { sandbox: "allow-scripts allow-same-origin allow-presentation allow-forms allow-popups" })}
          />
        )}
      </div>

      {/* Under-player Information & Theatre toggle controls */}
      <div className="mt-5 flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-[#0c0c0e]/80 backdrop-blur-md border border-zinc-800/80 rounded-2xl text-right" dir="rtl">
        <div>
          <div className="flex items-center gap-2 mb-1.5 justify-start">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-sm shadow-red-500" />
            <span className="text-[10px] text-zinc-400 font-semibold tracking-wider">
              {videoUrl.includes('stmruby.com') 
                ? 'مشغل Stmruby السريع' 
                : (activeVideoType === 'direct' ? 'بث مباشر آمن' : 'مضمن مشفر')}
            </span>
          </div>
          <h1 className="text-lg md:text-xl font-bold text-zinc-100 flex items-center gap-2">
            <Film className="w-5 h-5 text-red-500 shrink-0" />
            {title}
          </h1>
        </div>

        {/* Cinema Settings Controls */}
        <div className="flex items-center gap-3 self-end md:self-auto">
          <button
            id="theater-mode-toggle"
            onClick={() => setIsTheaterMode(!isTheaterMode)}
            className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 cursor-pointer ${
              isTheaterMode 
                ? 'bg-red-600 text-white border-red-500 shadow-lg shadow-red-950/20' 
                : 'bg-[#050507] text-zinc-400 border-zinc-800 hover:text-zinc-200'
            }`}
          >
            {isTheaterMode ? 'وضع السينما الممتد' : 'الوضع الافتراضي'}
          </button>
          
          {activeVideoType === 'direct' && (
            <a
              id="direct-download-link"
              href={videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-[#050507] hover:bg-[#121215] border border-zinc-800 text-zinc-300 hover:text-zinc-100 text-xs font-semibold rounded-xl transition-all"
            >
              <span>مشاهدة المصدر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
