import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Eye,
  Heart,
  Share,
  Bookmark,
  Users,
  Calendar,
  Award,
  Zap,
} from 'lucide-react';

const Analytics: React.FC = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('30d');

  const platforms = ['all', 'TikTok', 'Instagram', 'YouTube', 'LinkedIn', 'Twitter'];
  const periods = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' },
  ];

  const overviewStats = [
    {
      label: 'Total Followers',
      value: '124.5K',
      change: '+12.3%',
      icon: Users,
      color: 'blue',
      trend: 'up'
    },
    {
      label: 'Total Reach',
      value: '2.8M',
      change: '+24.7%',
      icon: Eye,
      color: 'green',
      trend: 'up'
    },
    {
      label: 'Engagement Rate',
      value: '8.4%',
      change: '+2.1%',
      icon: Heart,
      color: 'red',
      trend: 'up'
    },
    {
      label: 'Content Created',
      value: '187',
      change: '+15.2%',
      icon: BarChart3,
      color: 'purple',
      trend: 'up'
    },
  ];

  const platformStats = [
    {
      platform: 'TikTok',
      followers: '45.2K',
      growth: '+18.5%',
      engagement: '12.7%',
      topContent: 'Morning Routine Reality',
      color: 'bg-black'
    },
    {
      platform: 'Instagram',
      followers: '38.1K',
      growth: '+14.2%',
      engagement: '9.8%',
      topContent: 'Office Outfit Transition',
      color: 'bg-gradient-to-r from-purple-500 to-pink-500'
    },
    {
      platform: 'YouTube',
      followers: '28.7K',
      growth: '+22.1%',
      engagement: '6.3%',
      topContent: 'AI Tools Review',
      color: 'bg-red-500'
    },
    {
      platform: 'LinkedIn',
      followers: '12.5K',
      growth: '+8.9%',
      engagement: '4.2%',
      topContent: 'Business Growth Tips',
      color: 'bg-blue-600'
    },
  ];

  const topPerformingContent = [
    {
      title: 'Morning Routine That Actually Works',
      platform: 'TikTok',
      views: '2.3M',
      engagement: '15.7%',
      likes: '234K',
      shares: '12.5K',
      date: '2024-12-10'
    },
    {
      title: 'AI Tool That Changed Everything',
      platform: 'YouTube',
      views: '890K',
      engagement: '18.2%',
      likes: '67K',
      shares: '8.9K',
      date: '2024-12-08'
    },
    {
      title: 'Office Outfit Transformation',
      platform: 'Instagram',
      views: '1.2M',
      engagement: '12.4%',
      likes: '156K',
      shares: '9.8K',
      date: '2024-12-06'
    },
    {
      title: 'Small Business Growth Hack',
      platform: 'LinkedIn',
      views: '345K',
      engagement: '8.9%',
      likes: '23K',
      shares: '5.6K',
      date: '2024-12-05'
    },
  ];

  const aiInsights = [
    {
      type: 'success',
      insight: 'Your TikTok content performs 40% better on Tuesday mornings',
      action: 'Schedule more TikTok posts for Tuesdays at 9 AM',
    },
    {
      type: 'opportunity',
      insight: 'Instagram carousel posts get 3x more saves than single images',
      action: 'Create more educational carousel content',
    },
    {
      type: 'warning',
      insight: 'YouTube Shorts engagement dropped 15% this week',
      action: 'Try trending audio and faster-paced content',
    },
    {
      type: 'tip',
      insight: 'Posts with personal stories get 60% higher engagement',
      action: 'Share more behind-the-scenes and personal content',
    },
  ];

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'success': return <Award className="w-5 h-5 text-green-500" />;
      case 'opportunity': return <Zap className="w-5 h-5 text-blue-500" />;
      case 'warning': return <TrendingUp className="w-5 h-5 text-orange-500" />;
      case 'tip': return <Heart className="w-5 h-5 text-purple-500" />;
      default: return <BarChart3 className="w-5 h-5 text-gray-500" />;
    }
  };

  const getInsightBg = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200';
      case 'opportunity': return 'bg-blue-50 border-blue-200';
      case 'warning': return 'bg-orange-50 border-orange-200';
      case 'tip': return 'bg-purple-50 border-purple-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600">Track performance across all platforms</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
            Generate Report
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {periods.map(period => (
                <option key={period.value} value={period.value}>
                  {period.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            red: 'from-red-500 to-red-600',
            purple: 'from-purple-500 to-purple-600',
          };

          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex items-center space-x-1 text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-sm font-medium">{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Platform Performance */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900">Platform Performance</h3>
            </div>
            <div className="p-6 space-y-6">
              {platformStats.map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 ${platform.color} rounded-lg flex items-center justify-center text-white font-bold text-sm`}>
                      {platform.platform.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{platform.platform}</h4>
                      <p className="text-sm text-gray-600">{platform.followers} followers</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="text-sm text-gray-600">Growth</p>
                        <p className="font-semibold text-green-600">{platform.growth}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Engagement</p>
                        <p className="font-semibold text-gray-900">{platform.engagement}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* AI Insights */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center space-x-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span>AI Insights</span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getInsightBg(insight.type)}`}>
                  <div className="flex items-start space-x-3">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 mb-2">{insight.insight}</p>
                      <p className="text-xs text-gray-600 font-medium">{insight.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-xl font-semibold text-gray-900">Top Performing Content</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Likes
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Shares
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {topPerformingContent.map((content, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{content.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                      {content.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{content.views}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-600 font-medium">{content.engagement}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Heart className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{content.likes}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Share className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-gray-900">{content.shares}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-gray-600">{content.date}</span>
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

export default Analytics;