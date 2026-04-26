import React, { useState } from 'react';
import { X, Twitter, MessageCircle, ExternalLink, Send } from 'lucide-react';
import { savePost } from '../utils/postHistory';

interface ManualPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostPublished: () => void;
}

const ManualPostModal: React.FC<ManualPostModalProps> = ({
  isOpen,
  onClose,
  onPostPublished,
}) => {
  const [postContent, setPostContent] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<{
    twitter: boolean;
    whatsapp: boolean;
  }>({
    twitter: true,
    whatsapp: false,
  });

  if (!isOpen) return null;

  const togglePlatform = (platform: 'twitter' | 'whatsapp') => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform],
    }));
  };

  const isValid = postContent.trim().length > 0 && 
    (selectedPlatforms.twitter || selectedPlatforms.whatsapp) &&
    (!selectedPlatforms.twitter || postContent.length <= 280);

  const handlePublish = () => {
    if (!isValid) return;

    const platforms: ('twitter' | 'whatsapp')[] = [];
    if (selectedPlatforms.twitter) platforms.push('twitter');
    if (selectedPlatforms.whatsapp) platforms.push('whatsapp');

    // Save to history
    savePost({
      content: postContent,
      platforms,
      reason: 'Manual Post',
      metrics: {
        shares: 0,
        views: 0,
      },
    });

    // Open Twitter if selected
    if (selectedPlatforms.twitter) {
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(postContent)}`;
      window.open(twitterUrl, '_blank');
    }

    // Open WhatsApp if selected
    if (selectedPlatforms.whatsapp) {
      navigator.clipboard.writeText(postContent).catch(err => 
        console.error('Failed to copy:', err)
      );
      window.open('https://whatsapp.com/channel/0029VbC58oZAYlUGUJm3wG0n', '_blank');
    }

    // Notify parent component
    onPostPublished();
    
    // Reset and close
    setPostContent('');
    setSelectedPlatforms({ twitter: true, whatsapp: false });
    onClose();
  };

  const handleClose = () => {
    setPostContent('');
    setSelectedPlatforms({ twitter: true, whatsapp: false });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl shadow-2xl rounded-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-white/20 rounded-full flex items-center justify-center">
              <Send className="h-5 w-5" />
            </div>
            <span className="font-semibold text-lg">Compose Manual Post</span>
          </div>
          <button 
            onClick={handleClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-700 text-sm mb-4">
            Write your custom message and select platforms to publish on.
          </p>

          {/* Text Area */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Post Content
            </label>
            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-gray-900 resize-none"
              placeholder="Write your message here... Use emojis and hashtags for better engagement."
            />
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                Character count: {postContent.length}
              </span>
              {selectedPlatforms.twitter && postContent.length > 280 && (
                <span className="text-xs text-red-600 font-semibold">
                  Exceeds Twitter limit (280 chars)
                </span>
              )}
            </div>
          </div>

          {/* Platform Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Platforms
            </label>
            <div className="space-y-2">
              {/* Twitter */}
              <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                style={{
                  borderColor: selectedPlatforms.twitter ? '#1DA1F2' : '#e5e7eb',
                  backgroundColor: selectedPlatforms.twitter ? '#eff9ff' : 'white',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.twitter}
                  onChange={() => togglePlatform('twitter')}
                  className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="h-10 w-10 bg-[#1DA1F2] rounded-lg flex items-center justify-center shrink-0">
                  <Twitter className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">Twitter</p>
                  <p className="text-xs text-gray-500">Public timeline post (max 280 characters)</p>
                </div>
              </label>

              {/* WhatsApp */}
              <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50"
                style={{
                  borderColor: selectedPlatforms.whatsapp ? '#25D366' : '#e5e7eb',
                  backgroundColor: selectedPlatforms.whatsapp ? '#f0fdf4' : 'white',
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedPlatforms.whatsapp}
                  onChange={() => togglePlatform('whatsapp')}
                  className="h-5 w-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                />
                <div className="h-10 w-10 bg-[#25D366] rounded-lg flex items-center justify-center shrink-0">
                  <MessageCircle className="h-5 w-5 text-white fill-current" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">WhatsApp Channel</p>
                  <p className="text-xs text-gray-500">Broadcast to VayuSetu Updates community</p>
                </div>
              </label>
            </div>
          </div>

          {/* Help Text */}
          <div className="mb-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Note:</strong> This will open Twitter/WhatsApp in a new tab. You can review and modify before final posting.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={!isValid}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-600"
            >
              <Send className="h-4 w-4" />
              Publish Now
            </button>
          </div>

          {/* WhatsApp Channel Link */}
          {selectedPlatforms.whatsapp && (
            <div className="mt-3 text-center">
              <button
                onClick={() => window.open('https://whatsapp.com/channel/0029VbC58oZAYlUGUJm3wG0n', '_blank')}
                className="text-xs text-gray-600 hover:text-[#25D366] font-medium inline-flex items-center gap-1 transition-colors"
              >
                View WhatsApp Channel
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManualPostModal;
