import React, { useState } from 'react';
import {
  Filter,
  TrendingUp,
  Eye,
  Clock,
  Star,
  Play,
  BarChart3,
  Zap,
} from 'lucide-react';

interface Trend {
  id: string;
  title: string;
  platform: string;
  growth: string;
  engagement: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  format: string;
  region: string;
  previewUrl: string;
  description: string;
  estimatedReach: string;
  dropoffPrediction: string;
}

const TrendRadar: React.FC = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const trends: Trend[] = [
    {
      id: '1',
      title: 'Morning Routine Reality Check',
      platform: 'TikTok',
      growth: '+142%',
      engagement: '89K avg',
      difficulty: 'Easy',
      format: 'POV/Voice-over',
      region: 'Global',
      previewUrl: 'https://images.pexels.com/photos/6001558/pexels-photo-6001558.jpeg',
      description: 'Honest take on morning routines vs. reality',
      estimatedReach: '2.3M',
      dropoffPrediction: '7 days',
    },
    {
      id: '2',
      title: '#SmallBusinessHustle',
      platform: 'Instagram',
      growth: '+89%',
      engagement: '156K avg',
      difficulty: 'Medium',
      format: 'Carousel/Story',
      region: 'US/UK',
      previewUrl: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg',
      description: 'Behind-the-scenes small business content',
      estimatedReach: '1.8M',
      dropoffPrediction: '12 days',
    },
    {
      id: '3',
      title: 'AI Tools That Actually Work',
      platform: 'YouTube Shorts',
      growth: '+234%',
      engagement: '78K avg',
      difficulty: 'Hard',
      format: 'Screen Recording',
      region: 'Global',
      previewUrl: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
      description: 'Practical AI tool reviews and tutorials',
      estimatedReach: '4.1M',
      dropoffPrediction: '14 days',
    },
    {
      id: '4',
      title: 'Office Outfit Transition',
      platform: 'Instagram',
      growth: '+67%',
      engagement: '203K avg',
      difficulty: 'Easy',
      format: 'Transition/Reel',
      region: 'Global',
      previewUrl: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
      description: 'Quick outfit changes from casual to professional',
      estimatedReach: '1.2M',
      dropoffPrediction: '5 days',
    },
    {
      id: '5',
      title: 'Productivity Hack Tests',
      platform: 'TikTok',
      growth: '+178%',
      engagement: '125K avg',
      difficulty: 'Medium',
      format: 'Before/After',
      region: 'Global',
      previewUrl: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg',
      description: 'Testing viral productivity tips and rating them',
      estimatedReach: '3.2M',
      dropoffPrediction: '10 days',
    },
    {
      id: '6',
      title: 'Budget Meal Prep Ideas',
      platform: 'YouTube Shorts',
      growth: '+91%',
      engagement: '167K avg',
      difficulty: 'Easy',
      format: 'How-to/Tutorial',
      region: 'Global',
      previewUrl: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      description: 'Quick, affordable meal prep for busy people',
      estimatedReach: '2.7M',
      dropoffPrediction: '8 days',
    },
  ];

  const platforms = ['all', 'TikTok', 'Instagram', 'YouTube Shorts'];
  const formats = ['all', 'POV/Voice-over', 'Carousel/Story', 'Transition/Reel', 'How-to/Tutorial', 'Before/After'];

  const filteredTrends = trends.filter(trend => {
    if (selectedPlatform !== 'all' && trend.platform !== selectedPlatform) return false;
    return true;
  });

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
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span>TrendRadar™</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Real-time trend tracking across all major platforms
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Auto-Update</span>
          </button>
          <span className="text-sm text-gray-500">Last updated: 2 mins ago</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {platforms.map(platform => (
                <option key={platform} value={platform}>
                  {platform === 'all' ? 'All Platforms' : platform}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              {formats.map(format => (
                <option key={format} value={format}>
                  {format === 'all' ? 'All Formats' : format}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
            <select className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option value="all">All Regions</option>
              <option value="global">Global</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="eu">Europe</option>
            </select>
          </div>
        </div>
      </div>

      {/* Trending Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTrends.map((trend) => (
          <div
            key={trend.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer"
          >
            {/* Preview Image */}
            <div className="relative overflow-hidden h-48">
              <img
                src={trend.previewUrl}
                alt={trend.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute top-4 left-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPlatformColor(trend.platform)}`}>
                  {trend.platform}
                </span>
              </div>
              <div className="absolute top-4 right-4">
                <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
                  <Play className="w-4 h-4 text-white ml-0.5" />
                </button>
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-800">{trend.format}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(trend.difficulty)}`}>
                      {trend.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-gray-900 text-lg group-hover:text-blue-600 transition-colors">
                  {trend.title}
                </h3>
                <div className="flex items-center space-x-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{trend.growth}</span>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {trend.description}
              </p>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{trend.engagement}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{trend.estimatedReach} reach</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{trend.dropoffPrediction}</span>
                  </div>
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Use Template →
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <button className="bg-white border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:shadow-md transition-all duration-200">
          Load More Trends
        </button>
      </div>
    </div>
  );
};

export default TrendRadar;