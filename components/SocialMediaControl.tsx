import React, { useState, useEffect, useRef } from 'react';
import { 
  Share2, 
  Twitter, 
  Instagram, 
  MessageCircle, 
  PenSquare, 
  Settings,
  Image as ImageIcon,
  Play,
  Pause,
  Mic,
  Frown,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Volume2
} from 'lucide-react';
import ManualPostModal from './ManualPostModal';
import { getPostHistory, initializeSampleData, getRelativeTime, savePost, SocialPost } from '../utils/postHistory';

const SocialMediaControl: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isManualPostModalOpen, setIsManualPostModalOpen] = useState(false);
  const [postHistory, setPostHistory] = useState<SocialPost[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize post history on mount
  useEffect(() => {
    initializeSampleData();
    loadPostHistory();
  }, []);

  const loadPostHistory = () => {
    const history = getPostHistory();
    setPostHistory(history);
  };

  // Create audio element for Hindi voice message
  useEffect(() => {
    // Using Web Speech API for Hindi text-to-speech
    const hindiText = "नमस्कार। आपके क्षेत्र में प्रदूषण का स्तर उच्च है। कृपया आज सुबह की सैर से बचें।";
    
    // Create speech synthesis
    const speak = () => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(hindiText);
        utterance.lang = 'hi-IN';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        
        utterance.onend = () => {
          setIsPlaying(false);
        };
        
        return utterance;
      }
      return null;
    };

    if (isPlaying) {
      const utterance = speak();
      if (utterance) {
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        window.speechSynthesis.speak(utterance);
      }
    } else {
      window.speechSynthesis.cancel();
    }

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [isPlaying]);

  const handlePostPublished = () => {
    loadPostHistory();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER SECTION */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm p-6 border border-blue-100">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-14 w-14 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <Share2 className="h-7 w-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-serif-heading">
              Social Media Command Center
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              AI-driven multi-channel broadcasting, sentiment analysis, and rumor control.
            </p>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="p-4 bg-white rounded-lg border border-blue-100 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="font-semibold text-gray-900">
              Auto-Broadcaster Active
            </span>
          </div>
          <span className="text-xs font-medium text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
            Last active: 2 minutes ago
          </span>
        </div>
      </div>
      
      {/* 1. POST HISTORY */}
      <div>
        <div className="flex items-center justify-between mb-3">
           <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <ImageIcon className="h-4 w-4" /> Recent Posts
          </h3>
          <span className="text-xs text-gray-500 font-medium">{postHistory.length} total</span>
        </div>
        
        {postHistory.length === 0 ? (
          <div className="p-8 bg-white rounded-xl border border-gray-200 text-center">
            <p className="text-gray-500 text-sm">No posts yet. Start by composing a manual post!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {postHistory.map((post) => (
              <div key={post.id} className="p-5 bg-white rounded-xl border border-gray-200 hover:border-blue-300 transition-all shadow-sm">
                <div className="flex flex-col md:flex-row gap-5">
                  
                  {/* Left: Text Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex -space-x-1">
                        {post.platforms.includes('twitter') && (
                          <div className="h-6 w-6 bg-sky-400 rounded-full flex items-center justify-center ring-2 ring-white">
                            <Twitter className="h-3 w-3 text-white fill-current" />
                          </div>
                        )}
                        {post.platforms.includes('instagram') && (
                          <div className="h-6 w-6 bg-gradient-to-br from-pink-500 to-orange-400 rounded-full flex items-center justify-center ring-2 ring-white">
                            <Instagram className="h-3 w-3 text-white" />
                          </div>
                        )}
                        {post.platforms.includes('whatsapp') && (
                          <div className="h-6 w-6 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-white">
                            <MessageCircle className="h-3 w-3 text-white fill-current" />
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-bold text-gray-500">Posted {getRelativeTime(post.timestamp)}</span>
                      {post.reason && (
                        <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
                          {post.reason}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-gray-800 leading-relaxed mb-4 whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Sentiment Pulse (only for auto-generated posts) */}
                    {post.reason !== 'Manual Post' && (
                      <div className="flex items-center gap-3 mt-auto pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 px-2 py-1 bg-red-50 rounded text-red-700 border border-red-100">
                          <Frown className="h-3.5 w-3.5" />
                          <span className="text-[10px] font-bold uppercase">Sentiment: Anxious (82%)</span>
                        </div>
                        <button className="flex items-center gap-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded hover:bg-blue-100 transition-colors">
                          <Sparkles className="h-3 w-3" />
                          Suggest Calming Reply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right: Generated Infographic Preview (only for emergency posts with location) */}
                  {post.location && post.reason.includes('Alert') && (
                    <div className="shrink-0 w-full md:w-48 aspect-[4/5] md:aspect-square relative rounded-lg overflow-hidden shadow-sm border border-gray-200 group cursor-pointer">
                      <div className="absolute inset-0 bg-gray-300 opacity-50 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Location_map_India_Delhi_EN.svg/1200px-Location_map_India_Delhi_EN.svg.png')] bg-cover bg-center grayscale"></div>
                      <div className="absolute inset-0 bg-red-900/80 mix-blend-multiply"></div>
                      
                      <div className="absolute inset-0 p-4 flex flex-col justify-between text-white">
                        <div className="flex justify-between items-start">
                          <AlertTriangle className="h-6 w-6 text-yellow-400" />
                          <div className="h-8 w-8 bg-white/20 backdrop-blur rounded-full flex items-center justify-center">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/84/Government_of_India_logo.svg/200px-Government_of_India_logo.svg.png" className="h-5 w-5 opacity-90 invert" alt="Logo" />
                          </div>
                        </div>
                        
                        <div className="text-center">
                           <p className="text-[10px] font-bold tracking-widest uppercase opacity-80">Emergency Alert</p>
                           <h3 className="text-xl font-black uppercase leading-none mb-1">{post.location}</h3>
                           <div className="inline-block bg-black/40 backdrop-blur px-2 py-1 rounded text-2xl font-bold text-yellow-400">
                             AQI 412
                           </div>
                        </div>

                        <div className="text-[9px] text-center font-medium opacity-75 border-t border-white/20 pt-2">
                           Generated by GovCommand AI
                        </div>
                      </div>

                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <span className="text-white text-xs font-bold flex items-center gap-2">
                           <ImageIcon className="h-4 w-4" /> View Full Res
                         </span>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Footer Metrics */}
                {post.metrics && (post.metrics.shares > 0 || post.metrics.views > 0) && (
                  <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 font-medium px-2">
                    {post.metrics.shares > 0 && (
                      <>
                        <span className="flex items-center gap-1"><Share2 className="h-3 w-3" /> {post.metrics.shares} Shares</span>
                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                      </>
                    )}
                    {post.metrics.views > 0 && <span>{post.metrics.views.toLocaleString()} Views</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. HYPER-LOCAL VOICE (WhatsApp) */}
      <div>
        <div className="flex items-center justify-between mb-3">
           <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide flex items-center gap-2">
            <Volume2 className="h-4 w-4" /> WhatsApp Community Broadcasts
          </h3>
        </div>

        <div className="p-5 bg-white rounded-xl border border-green-100 hover:border-green-300 transition-all shadow-sm relative overflow-hidden">
           {/* WhatsApp Background pattern decorative */}
           <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

           <div className="flex items-start gap-4 relative z-10">
              <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center shadow-md shrink-0">
                <MessageCircle className="h-6 w-6 text-white fill-current" />
              </div>

              <div className="flex-1">
                 <div className="flex justify-between items-start">
                   <div>
                     <h4 className="font-bold text-gray-900 text-sm">Target: Senior Citizens Group (West Delhi)</h4>
                     <p className="text-xs text-gray-500">Sent via WhatsApp API • 98% Delivery Rate</p>
                   </div>
                   <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">
                     Sent 12m ago
                   </span>
                 </div>

                 {/* Audio Player UI */}
                 <div className="mt-4 bg-gray-50 rounded-lg border border-gray-200 p-3 flex items-center gap-3">
                    <button 
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="h-10 w-10 bg-green-600 hover:bg-green-700 text-white rounded-full flex items-center justify-center transition-colors shadow-sm"
                    >
                      {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </button>
                    
                    <div className="flex-1 space-y-1.5">
                       <div className="flex justify-between text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          <span>AI Voice Note (Hindi)</span>
                          <span>0:45</span>
                       </div>
                       {/* Mock Waveform */}
                       <div className="h-8 flex items-center gap-0.5 opacity-60">
                          {[4, 8, 5, 10, 6, 12, 8, 4, 6, 14, 8, 4, 10, 12, 6, 4, 8, 12, 6, 4, 2].map((h, i) => (
                             <div 
                                key={i} 
                                className={`w-1.5 rounded-full transition-all duration-300 ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}
                                style={{ height: isPlaying ? `${Math.max(4, h + Math.random() * 10)}px` : `${h}px` }}
                             ></div>
                          ))}
                       </div>
                    </div>
                 </div>

                 <p className="text-xs text-gray-500 mt-2 italic flex items-center gap-1.5">
                   <Mic className="h-3 w-3" />
                   "Namaskar. Pollution levels in your area are high. Please avoid morning walks today..."
                 </p>

                 {/* Send to WhatsApp Button */}
                 <div className="mt-4 pt-3 border-t border-gray-200">
                   <button
                     onClick={() => {
                       const message = "🚨 *Pollution Alert - Voice Message*\n\nनमस्कार। आपके क्षेत्र में प्रदूषण का स्तर उच्च है। कृपया आज सुबह की सैर से बचें।\n\n_Namaskar. Pollution levels in your area are high. Please avoid morning walks today._\n\n🎧 Voice note: [Hindi Audio Message]\n\n#DelhiPollution #HealthAlert";
                       
                       // Save to post history
                       savePost({
                         content: message,
                         platforms: ['whatsapp'],
                         reason: 'WhatsApp Voice Broadcast',
                         location: 'West Delhi',
                         metrics: { shares: 0, views: 0 },
                       });
                       
                       // Copy to clipboard
                       navigator.clipboard.writeText(message).then(() => {
                         alert('Message copied! Opening WhatsApp channel...');
                       }).catch(err => {
                         console.error('Failed to copy:', err);
                       });
                       
                       // Open WhatsApp channel
                       window.open('https://whatsapp.com/channel/0029VbC58oZAYlUGUJm3wG0n', '_blank');
                       
                       // Reload post history
                       loadPostHistory();
                     }}
                     className="w-full py-2.5 bg-[#25D366] text-white rounded-lg font-semibold hover:bg-[#20ba5a] transition-colors shadow-sm flex items-center justify-center gap-2"
                   >
                     <MessageCircle className="h-4 w-4 fill-current" />
                     Send Voice Message to WhatsApp Channel
                   </button>
                   <p className="text-[10px] text-gray-500 text-center mt-2">
                     Message will be copied. Paste it in the WhatsApp channel to broadcast.
                   </p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 4. RUMOR CONTROL & ACTION BAR */}
      <div className="pt-2">
        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-3">Action Console</h3>
        <div className="flex flex-col md:flex-row gap-3">
          
          <button 
            onClick={() => setIsManualPostModalOpen(true)}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold flex items-center justify-center gap-2 shadow-sm transition-all hover:shadow"
          >
            <PenSquare className="h-5 w-5" />
            Compose Manual Post
          </button>
          
          {/* Rumor Control Button */}
          <button className="flex-1 py-3 bg-white border-2 border-green-600 text-green-700 rounded-lg hover:bg-green-50 font-bold flex items-center justify-center gap-2 shadow-sm transition-all group">
            <ShieldCheck className="h-5 w-5 group-hover:scale-110 transition-transform" />
            📢 Issue Fact-Check
          </button>
          
          <button className="px-4 py-3 border border-gray-300 bg-white rounded-lg hover:bg-gray-50 font-semibold text-gray-700 flex items-center gap-2">
            <Settings className="h-5 w-5" />
          </button>
        </div>
        
        <p className="text-[11px] text-center text-gray-400 mt-3">
          All posts are watermarked and logged for audit purposes.
        </p>
      </div>
      
      {/* Manual Post Modal */}
      <ManualPostModal
        isOpen={isManualPostModalOpen}
        onClose={() => setIsManualPostModalOpen(false)}
        onPostPublished={handlePostPublished}
      />
    </div>
  );
};

export default SocialMediaControl;
