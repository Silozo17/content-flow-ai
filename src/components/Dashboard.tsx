import React from 'react';
import {
  BarChart3,
  Brain,
  Calendar,
  Hash,
  Radar,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
  Target,
  Clock,
  Star,
} from 'lucide-react';
import { UserRole, ActiveView } from '../App';

interface DashboardProps {
  userRole: UserRole;
  setActiveView: (view: ActiveView) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ userRole, setActiveView }) => {
  const quickStats = [
    { label: 'Content Created', value: '247', change: '+12%', icon: Brain, color: 'blue' },
    { label: 'Trending Topics', value: '18', change: '+5', icon: TrendingUp, color: 'green' },
    { label: 'Scheduled Posts', value: '32', change: 'This Week', icon: Calendar, color: 'purple' },
    { label: 'Active Clients', value: userRole === 'agency' ? '8' : '1', change: userRole === 'agency' ? '+2' : 'You', icon: Users, color: 'orange' },
  ];

  const trendingTopics = [
    { topic: '#SummerVibes2024', growth: '+142%', platform: 'TikTok', difficulty: 'Easy' },
    { topic: 'Morning Routine POV', growth: '+89%', platform: 'Instagram', difficulty: 'Medium' },
    { topic: 'AI Tools Review', growth: '+67%', platform: 'YouTube', difficulty: 'Hard' },
    { topic: 'Quick Recipe Hacks', growth: '+234%', platform: 'TikTok', difficulty: 'Easy' },
  ];

  const recentContent = [
    { title: '5 Morning Habits Hook', status: 'Published', engagement: '12.5K', platform: 'TikTok' },
    { title: 'Client Success Story', status: 'Scheduled', engagement: 'Pending', platform: 'LinkedIn' },
    { title: 'Behind the Scenes Reel', status: 'Draft', engagement: 'Preview', platform: 'Instagram' },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back! 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Here's what's happening with your content today.
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setActiveView('ai')}
            className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Generate Content</span>
            </div>
          </button>
          <button
            onClick={() => setActiveView('trends')}
            className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4" />
              <span>Find Trends</span>
            </div>
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            purple: 'from-purple-500 to-purple-600',
            orange: 'from-orange-500 to-orange-600',
          };
          
          return (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-green-600 text-sm font-medium mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 bg-gradient-to-r ${colorClasses[stat.color as keyof typeof colorClasses]} rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Trending Topics */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <Radar className="w-5 h-5 text-blue-500" />
                  <span>Trending Now</span>
                </h3>
                <button
                  onClick={() => setActiveView('trends')}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  View All
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {trendingTopics.map((trend, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{trend.topic}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">{trend.platform}</span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        trend.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                        trend.difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {trend.difficulty}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{trend.growth}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Content */}
        <div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <span>Recent Content</span>
              </h3>
            </div>
            <div className="p-6 space-y-4">
              {recentContent.map((content, index) => (
                <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                  <h4 className="font-medium text-gray-900 mb-2">{content.title}</h4>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      content.status === 'Published' ? 'bg-green-100 text-green-700' :
                      content.status === 'Scheduled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {content.status}
                    </span>
                    <span className="text-sm text-gray-600">{content.platform}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{content.engagement}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <span>Quick Actions</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Generate Hook', icon: Brain, action: () => setActiveView('ai') },
            { label: 'Find Hashtags', icon: Hash, action: () => setActiveView('hashtags') },
            { label: 'Schedule Post', icon: Calendar, action: () => setActiveView('calendar') },
            { label: 'View Analytics', icon: BarChart3, action: () => setActiveView('analytics') },
          ].map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={index}
                onClick={action.action}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 group"
              >
                <Icon className="w-6 h-6 text-gray-600 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  {action.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;