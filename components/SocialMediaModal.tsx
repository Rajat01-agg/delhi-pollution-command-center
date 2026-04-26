import React, { useState } from 'react';
import { X, Twitter, Info, MessageCircle, ExternalLink } from 'lucide-react';
import { savePost } from '../utils/postHistory';

interface SocialMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionTitle: string;
  location: string;
  onPublish: (content: string, platform: 'twitter' | 'whatsapp') => void;
}

const SocialMediaModal: React.FC<SocialMediaModalProps> = ({
  isOpen,
  onClose,
  actionTitle,
  location,
  onPublish,
}) => {
  // Generate AI draft based on action context
  const generateDraft = () => {
    const title = actionTitle.toLowerCase();
    
    // Stop Construction / Halt Construction
    if (title.includes('halt') || title.includes('stop') && title.includes('construction')) {
      return `⚠️ Citizens Attention: Construction activities in ${location} are halted immediately due to rising pollution levels. Co-operate for cleaner air. #DelhiFightPollution`;
    }
    
    // Ban Diesel Trucks
    if (title.includes('diesel') || title.includes('truck')) {
      return `🚫 Traffic Alert: Entry of diesel trucks restricted in ${location} to combat severe air quality. Plan your logistics accordingly. #DelhiAirQuality`;
    }
    
    // Close Schools
    if (title.includes('school') || title.includes('close')) {
      return `📚 Important: Schools in ${location} shifting to online mode due to severe air pollution. Student safety is our priority. #DelhiEducation`;
    }
    
    // Work From Home
    if (title.includes('work from home') || title.includes('wfh')) {
      return `💼 Notice: Government offices in ${location} implementing 50% WFH capacity as pollution levels rise. Stay home, stay safe. #DelhiGRAP`;
    }
    
    // Vehicle Bans (BS-III / BS-IV)
    if (title.includes('vehicle') || title.includes('bs-') || title.includes('petrol') || title.includes('ban')) {
      return `🚗 Vehicle Restriction: BS-III petrol and BS-IV diesel vehicles banned in ${location}. Use public transport. #DelhiCleanAir`;
    }
    
    // Mining / Stone Crushers
    if (title.includes('mining') || title.includes('stone') || title.includes('crusher')) {
      return `⛏️ Environmental Action: Mining and stone crushing operations halted in ${location} to reduce dust pollution. #DelhiEnvironment`;
    }
    
    // Public Transport
    if (title.includes('transport') || title.includes('metro') || title.includes('bus')) {
      return `🚇 Public Transport Update: Increased Metro & Bus frequency in ${location} to encourage eco-friendly commuting. Use public transport! #DelhiMetro`;
    }
    
    // Default generic message
    return `⚠️ Pollution Alert: Emergency measures activated in ${location} under GRAP protocol. Citizens requested to cooperate. #DelhiFightPollution`;
  };

  const [draftText, setDraftText] = useState(generateDraft());

  if (!isOpen) return null;

  const handleTwitterPublish = () => {
    // Save to post history
    savePost({
      content: draftText,
      platforms: ['twitter'],
      reason: actionTitle,
      location: location,
      metrics: {
        shares: 0,
        views: 0,
      },
    });

    // Encode the draft text for Twitter
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(draftText)}`;
    
    // Open Twitter in a new tab
    window.open(twitterUrl, '_blank');
    
    // Call the onPublish callback with the draft text and platform
    onPublish(draftText, 'twitter');
  };

  const handleWhatsAppPublish = async () => {
    // Save to post history
    savePost({
      content: draftText,
      platforms: ['whatsapp'],
      reason: actionTitle,
      location: location,
      metrics: {
        shares: 0,
        views: 0,
      },
    });

    // Copy message to clipboard
    try {
      await navigator.clipboard.writeText(draftText);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
    
    // Open the WhatsApp channel - will open in native app on Mac
    window.location.href = 'https://whatsapp.com/channel/0029VbC58oZAYlUGUJm3wG0n';
    
    // Call the onPublish callback with the draft text and platform
    onPublish(draftText, 'whatsapp');
  };

  const handleViewChannel = () => {
    // Open the specific WhatsApp channel to verify post
    window.open('https://whatsapp.com/channel/0029VbC58oZAYlUGUJm3wG0n', '_blank');
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
              <Twitter className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">Order Issued Successfully</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 text-base mb-6 leading-relaxed">
            Do you want to publish a public alert regarding this action to official Social Media handles?
          </p>

          {/* AI Suggestion Box */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              AI-Generated Draft
              <span className="ml-2 text-xs font-normal text-gray-500">(You can edit before publishing)</span>
            </label>
            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 resize-none"
              placeholder="AI-generated message will appear here..."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                Character count: {draftText.length} / 280
              </span>
              {draftText.length > 280 && (
                <span className="text-xs text-red-600 font-semibold">
                  Exceeds Twitter limit
                </span>
              )}
            </div>
          </div>

          {/* Human-in-the-Loop Notice */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200 flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed">
              <strong>Human-in-the-Loop Protocol:</strong> Opens Twitter or WhatsApp Web for final officer verification. You can review and modify the post before publishing.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Primary Actions Row */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
              >
                No, Internal Only
              </button>
              <button
                onClick={handleTwitterPublish}
                disabled={draftText.length === 0 || draftText.length > 280}
                className="flex-1 px-4 py-3 bg-[#1DA1F2] text-white rounded-lg font-semibold hover:bg-[#1a8cd8] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Twitter className="h-4 w-4" />
                Publish to Twitter
              </button>
            </div>

            {/* WhatsApp Broadcast Section */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleWhatsAppPublish}
                  disabled={draftText.length === 0}
                  className="w-full px-4 py-3 bg-[#25D366] text-white rounded-lg font-semibold hover:bg-[#20ba5a] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Opens WhatsApp Web. Select 'VayuSetu Updates' from your chat list to post."
                >
                  <MessageCircle className="h-4 w-4" />
                  Broadcast to WhatsApp Channel
                </button>
                
                {/* View Channel Link */}
                <button
                  onClick={handleViewChannel}
                  className="text-xs text-gray-600 hover:text-[#25D366] font-medium flex items-center justify-center gap-1 transition-colors"
                >
                  View Live Channel
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              
              {/* WhatsApp Info */}
              <p className="text-xs text-gray-500 mt-2 text-center italic">
                Opens WhatsApp Web. Select 'VayuSetu Updates' from your chat list to post.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SocialMediaModal;
