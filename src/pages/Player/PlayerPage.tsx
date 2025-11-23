import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Heart, Share2, Volume2 } from 'lucide-react';

interface AudioCard {
  id: number;
  sender_name: string;
  receiver_name: string;
  audio_path: string;
  image_path?: string;
  status: string;
}

export function PlayerPage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [card, setCard] = useState<AudioCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Extract ID from URL (subdomain or path)
    // For local dev/testing, we might use query param or path
    const pathParts = window.location.pathname.split('/');
    const id = pathParts[pathParts.length - 1] || '1'; // Default to 1 for dev if empty

    fetchCard(id);
  }, []);

  const fetchCard = async (id: string) => {
    try {
      const response = await fetch(`https://estanciaa.app.br/api/public/audio-cards/${id}`);
      if (!response.ok) throw new Error('Cartão não encontrado');
      const data = await response.json();
      setCard(data);
    } catch (err) {
      setError('Mensagem não encontrada ou expirada.');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-900 to-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent border-white"></div>
      </div>
    );
  }

  if (error || !card) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">😕</h1>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-900 via-black to-black text-white flex flex-col">
      {/* Header */}
      <div className="p-6 flex justify-between items-center">
        <div className="text-xs font-bold tracking-widest uppercase text-pink-200">Estância A</div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        {/* Album Art */}
        <div className="w-64 h-64 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg shadow-2xl mb-8 flex items-center justify-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors z-10"></div>
          {card.image_path ? (
            <img 
              src={`https://estanciaa.app.br/api/${card.image_path}`} 
              alt="Cover" 
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src="/logo.png" 
              alt="Cover" 
              className="w-32 h-32 object-contain opacity-80 drop-shadow-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
               <Play size={48} className="fill-white text-white opacity-80" />
            </div>
          )}
        </div>

        {/* Track Info */}
        <div className="w-full mb-8">
          <div className="flex justify-between items-end mb-1">
            <div>
              <h1 className="text-2xl font-bold mb-1">Mensagem Especial</h1>
              <p className="text-gray-400">De: {card.sender_name}</p>
              <p className="text-gray-400 text-sm">Para: {card.receiver_name}</p>
            </div>
            <button className="text-pink-500 hover:scale-110 transition-transform">
              <Heart className="fill-pink-500" size={24} />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full mb-6">
          <input
            type="range"
            ref={progressBarRef}
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleProgressChange}
            style={{
              backgroundSize: `${(currentTime / (duration || 1)) * 100}% 100%`
            }}
            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer 
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full hover:[&::-webkit-slider-thumb]:scale-125 transition-all
              bg-gradient-to-r from-white to-white bg-no-repeat"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration || 0)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between w-full max-w-xs mb-8">
          <button className="text-gray-400 hover:text-white transition-colors">
            <Share2 size={20} />
          </button>
          <button className="text-gray-300 hover:text-white transition-colors">
            <SkipBack size={28} className="fill-current" />
          </button>
          
          <button 
            onClick={togglePlay}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform text-black"
          >
            {isPlaying ? (
              <Pause size={32} className="fill-current" />
            ) : (
              <Play size={32} className="fill-current ml-1" />
            )}
          </button>

          <button className="text-gray-300 hover:text-white transition-colors">
            <SkipForward size={28} className="fill-current" />
          </button>
          <button className="text-gray-400 hover:text-white transition-colors">
            <Volume2 size={20} />
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={`https://estanciaa.app.br/api/${card.audio_path}`}
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={onLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />
    </div>
  );
}
