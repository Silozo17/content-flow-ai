import React, { useState } from 'react';
import {
  Sparkles,
  Play,
  Heart,
  Bookmark,
  Share,
  Eye,
  TrendingUp,
  Music,
  Copy,
  Filter,
} from 'lucide-react';

interface InspirationPost {
  id: string;
  title: string;
  platform: string;
  creator: string;
  views: string;
  engagement: string;
  hookAnalysis: string;
  suggestedScript: string;
  audioTrack: string;
  thumbnailUrl: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const InspirationFeed: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [currentPost, setCurrentPost] = useState(0);

  const inspirationPosts: InspirationPost[] = [
    {
      id: '1',
      title: 'Morning Routine That Actually Works',
      platform: 'TikTok',
      creator: '@productivityguru',
      views: '2.3M',
      engagement: '12.4%',
      hookAnalysis: 'Strong problem-solution hook with personal storytelling',
      suggestedScript: 'Start with: "I used to wake up at 6 AM and feel exhausted by 10 AM..." then reveal the 3 game-changing habits',
      audioTrack: 'Aesthetic Morning Vibes - Trending',
      thumbnailUrl: 'https://images.pexels.com/photos/6001558/pexels-photo-6001558.jpeg',
      category: 'Productivity',
      difficulty: 'Easy',
    },
    {
      id: '2',
      title: 'Small Business Growth Hack',
      platform: 'Instagram',
      creator: '@businesscoach',
      views: '890K',
      engagement: '18.7%',
      hookAnalysis: 'Curiosity-driven hook with specific promise',
      suggestedScript: 'Hook: "This one strategy grew my business 300% in 90 days" - then break down the 5-step process',
      audioTrack: 'Inspiring Corporate - Original',
      thumbnailUrl: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg',
      category: 'Business',
      difficulty: 'Medium',
    },
    {
      id: '3',
      title: 'AI Tool Review: Game Changer',
      platform: 'YouTube Shorts',
      creator: '@techreview',
      views: '1.5M',
      engagement: '22.1%',
      hookAnalysis: 'Authority-based hook with bold claim',
      suggestedScript: 'Open with screen recording, voice-over: "I tested 10 AI tools. This one doubled my productivity..." Show before/after',
      audioTrack: 'Tech Innovation - Trending',
      thumbnailUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
      category: 'Technology',
      difficulty: 'Hard',
    },
    {
      id: '4',
      title: 'Office Outfit Transformation',
      platform: 'Instagram',
      creator: '@styleguide',
      views: '3.2M',
      engagement: '15.8%',
      hookAnalysis: 'Visual transformation hook with relatability',
      suggestedScript: 'Start in casual clothes: "POV: You have 5 minutes to look professional" - quick transition reveal',
      audioTrack: 'Fashion Transition - Viral',
      thumbnailUrl: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
      category: 'Lifestyle',
      difficulty: 'Easy',
    },
    {
      id: '5',
      title: 'Productivity Myth Busted',
      platform: 'TikTok',
      creator: '@realproductivity',
      views: '4.1M',
      engagement: '19.3%',
      hookAnalysis: 'Myth-busting hook with contrarian angle',
      suggestedScript: 'Start: "Everyone says wake up at 5 AM for success. Here\'s why that\'s wrong..." Share data and alternatives',
      audioTrack: 'Truth Reveal - Trending',
      thumbnailUrl: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg',
      category: 'Productivity',
      difficulty: 'Medium',
    },
  ];

  const categories = ['all', 'Productivity', 'Business', 'Technology', 'Lifestyle'];
  const platforms = ['all', 'TikTok', 'Instagram', 'YouTube Shorts'];

  const filteredPosts = inspirationPosts.filter(post => {
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory;
    const matchesPlatform = selectedPlatform === 'all' || post.platform === selectedPlatform;
    return matchesCategory && matchesPlatform;
  });

  const currentPostData = filteredPosts[currentPost] || filteredPosts[0];

  const nextPost = () => {
    setCurrentPost((prev) => (prev + 1) % filteredPosts.length);
  };

  const prevPost = () => {
    setCurrentPost((prev) => (prev - 1 + filteredPosts.length) % filteredPosts.length);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'Hard': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'TikTok': return 'bg-black text-white';
      case 'Instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'YouTube Shorts': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspiration Feed</h1>
            <p className="text-gray-600">Discover viral content and trending formats</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>
                  {platform === 'all' ? 'All Platforms' : platform}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {currentPostData && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Video Preview */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="relative">
              <div className="aspect-[9/16] bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center relative overflow-hidden">
                <img
                  src={currentPostData.thumbnailUrl}
                  alt={currentPostData.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40" />
                
                {/* Platform Badge */}
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPlatformColor(currentPostData.platform)}`}>
                    {currentPostData.platform}
                  </span>
                </div>

                {/* Difficulty Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(currentPostData.difficulty)}`}>
                    {currentPostData.difficulty}
                  </span>
                </div>

                {/* Play Button */}
                <button className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Play className="w-8 h-8 text-white ml-1" />
                </button>

                {/* Stats Overlay */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-black/60 backdrop-blur-sm rounded-lg p-4 text-white">
                    <h3 className="font-semibold text-lg mb-2">{currentPostData.title}</h3>
                    <div className="flex items-center justify-between text-sm">
                      <span>{currentPostData.creator}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{currentPostData.views}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-4 h-4" />
                          <span>{currentPostData.engagement}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevPost}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <div className="w-0 h-0 border-t-4 border-b-4 border-r-6 border-transparent border-r-white ml-1"></div>
              </button>
              <button
                onClick={nextPost}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <div className="w-0 h-0 border-t-4 border-b-4 border-l-6 border-transparent border-l-white mr-1"></div>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors">
                    <Heart className="w-5 h-5" />
                    <span className="text-sm">Like</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors">
                    <Bookmark className="w-5 h-5" />
                    <span className="text-sm">Save</span>
                  </button>
                  <button className="flex items-center space-x-2 text-gray-600 hover:text-green-500 transition-colors">
                    <Share className="w-5 h-5" />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
                <button className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
                  Use as Template
                </button>
              </div>
            </div>
          </div>

          {/* Content Analysis */}
          <div className="space-y-6">
            {/* Hook Analysis */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  <span>Hook Analysis</span>
                </h3>
                <button
                  onClick={() => navigator.clipboard.writeText(currentPostData.hookAnalysis)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed">{currentPostData.hookAnalysis}</p>
            </div>

            {/* Suggested Script */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                  <span>AI Script Suggestion</span>
                </h3>
                <button
                  onClick={() => navigator.clipboard.writeText(currentPostData.suggestedScript)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 leading-relaxed">{currentPostData.suggestedScript}</p>
              </div>
            </div>

            {/* Audio Track */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Music className="w-5 h-5 text-green-500" />
                  <span>Audio Track</span>
                </h3>
                <button className="text-blue-600 hover:text-blue-700 font-medium text-sm">
                  Find Similar
                </button>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-lg flex items-center justify-center">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{currentPostData.audioTrack}</p>
                  <p className="text-sm text-gray-600">Trending on {currentPostData.platform}</p>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
                  <Play className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                <button className="bg-white border border-gray-200 p-3 rounded-lg hover:shadow-md transition-all duration-200 text-center">
                  <span className="text-sm font-medium text-gray-700">Add to Calendar</span>
                </button>
                <button className="bg-white border border-gray-200 p-3 rounded-lg hover:shadow-md transition-all duration-200 text-center">
                  <span className="text-sm font-medium text-gray-700">Generate Caption</span>
                </button>
                <button className="bg-white border border-gray-200 p-3 rounded-lg hover:shadow-md transition-all duration-200 text-center">
                  <span className="text-sm font-medium text-gray-700">Find Hashtags</span>
                </button>
                <button className="bg-white border border-gray-200 p-3 rounded-lg hover:shadow-md transition-all duration-200 text-center">
                  <span className="text-sm font-medium text-gray-700">Save to Library</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Post Counter */}
      <div className="text-center">
        <p className="text-gray-600">
          {currentPost + 1} of {filteredPosts.length} posts
        </p>
      </div>
    </div>
  );
};

export default InspirationFeed;