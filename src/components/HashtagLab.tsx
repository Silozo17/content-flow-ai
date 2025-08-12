import React, { useState } from 'react';
import {
  Hash,
  TrendingUp,
  Eye,
  Users,
  Copy,
  Save,
  Shuffle,
  BarChart3,
  Target,
  Zap,
} from 'lucide-react';

interface Hashtag {
  id: string;
  tag: string;
  usage: string;
  engagement: string;
  relevancy: number;
  saturation: 'Low' | 'Medium' | 'High';
  growth: string;
  category: string;
}

interface HashtagPack {
  id: string;
  name: string;
  tags: string[];
  purpose: string;
  estimated_reach: string;
}

const HashtagLab: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGoal, setSelectedGoal] = useState('reach');

  const hashtags: Hashtag[] = [
    {
      id: '1',
      tag: '#ContentCreator',
      usage: '2.5M',
      engagement: '8.4%',
      relevancy: 92,
      saturation: 'High',
      growth: '+12%',
      category: 'General',
    },
    {
      id: '2',
      tag: '#SmallBusiness',
      usage: '1.8M',
      engagement: '12.7%',
      relevancy: 88,
      saturation: 'Medium',
      growth: '+24%',
      category: 'Business',
    },
    {
      id: '3',
      tag: '#MorningRoutine',
      usage: '890K',
      engagement: '15.2%',
      relevancy: 76,
      saturation: 'Low',
      growth: '+89%',
      category: 'Lifestyle',
    },
    {
      id: '4',
      tag: '#ProductivityHacks',
      usage: '456K',
      engagement: '18.3%',
      relevancy: 94,
      saturation: 'Low',
      growth: '+156%',
      category: 'Business',
    },
    {
      id: '5',
      tag: '#AITools2024',
      usage: '234K',
      engagement: '22.1%',
      relevancy: 98,
      saturation: 'Low',
      growth: '+287%',
      category: 'Technology',
    },
    {
      id: '6',
      tag: '#EntrepreneurLife',
      usage: '1.2M',
      engagement: '9.8%',
      relevancy: 85,
      saturation: 'High',
      growth: '+5%',
      category: 'Business',
    },
  ];

  const hashtagPacks: HashtagPack[] = [
    {
      id: '1',
      name: 'Viral Growth Pack',
      tags: ['#ContentCreator', '#ViralTrends', '#ForYou', '#Trending', '#GrowthHack'],
      purpose: 'Maximum reach and discoverability',
      estimated_reach: '2.8M',
    },
    {
      id: '2',
      name: 'Business Authority',
      tags: ['#SmallBusiness', '#Entrepreneur', '#BusinessTips', '#Success', '#Leadership'],
      purpose: 'Establish thought leadership',
      estimated_reach: '1.5M',
    },
    {
      id: '3',
      name: 'Engagement Booster',
      tags: ['#AskMeAnything', '#EngageWithMe', '#QuestionTime', '#Interactive', '#Community'],
      purpose: 'Drive comments and saves',
      estimated_reach: '890K',
    },
  ];

  const categories = ['all', 'General', 'Business', 'Lifestyle', 'Technology'];
  const goals = [
    { value: 'reach', label: 'Maximum Reach', icon: Users },
    { value: 'engagement', label: 'High Engagement', icon: Target },
    { value: 'niche', label: 'Niche Authority', icon: Zap },
  ];

  const getSaturationColor = (saturation: string) => {
    switch (saturation) {
      case 'Low': return 'bg-green-100 text-green-700';
      case 'Medium': return 'bg-yellow-100 text-yellow-700';
      case 'High': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRelevancyColor = (relevancy: number) => {
    if (relevancy >= 90) return 'text-green-600';
    if (relevancy >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  const copyPack = (pack: HashtagPack) => {
    const tagsString = pack.tags.join(' ');
    navigator.clipboard.writeText(tagsString);
  };

  const filteredHashtags = hashtags.filter(hashtag => {
    const matchesCategory = selectedCategory === 'all' || hashtag.category === selectedCategory;
    const matchesSearch = hashtag.tag.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Hash className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Hashtag Lab</h1>
            <p className="text-gray-600">AI-curated hashtags with live analytics</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>Save Pack</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Hashtags</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search hashtags..."
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Goal</label>
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            >
              {goals.map(goal => (
                <option key={goal.value} value={goal.value}>
                  {goal.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Curated Packs */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span>Curated Hashtag Packs</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {hashtagPacks.map(pack => (
            <div key={pack.id} className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold text-gray-900 text-lg">{pack.name}</h4>
                  <p className="text-gray-600 text-sm mt-1">{pack.purpose}</p>
                </div>
                <button
                  onClick={() => copyPack(pack)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <Copy className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {pack.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gradient-to-r from-pink-100 to-orange-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{pack.estimated_reach}</span>
                  </div>
                  <button className="text-pink-600 hover:text-pink-700 font-medium text-sm flex items-center space-x-1">
                    <Shuffle className="w-4 h-4" />
                    <span>Regenerate</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hashtag Analytics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            <span>Hashtag Analytics</span>
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hashtag
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Relevancy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Saturation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredHashtags.map(hashtag => (
                <tr key={hashtag.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="font-medium text-gray-900">{hashtag.tag.slice(1)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{hashtag.usage}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{hashtag.engagement}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`text-sm font-medium ${getRelevancyColor(hashtag.relevancy)}`}>
                        {hashtag.relevancy}%
                      </div>
                      <div className="w-16 ml-2 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-pink-500 to-orange-500 h-2 rounded-full"
                          style={{ width: `${hashtag.relevancy}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getSaturationColor(hashtag.saturation)}`}>
                      {hashtag.saturation}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-green-600 font-medium">{hashtag.growth}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigator.clipboard.writeText(hashtag.tag)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HashtagLab;