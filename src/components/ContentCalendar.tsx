import React, { useState } from 'react';
import {
  Calendar,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  Circle,
} from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  platform: string;
  status: 'draft' | 'review' | 'approved' | 'scheduled' | 'published';
  date: Date;
  time: string;
  type: string;
  engagement?: string;
}

const ContentCalendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'kanban'>('month');
  const [selectedPlatform, setSelectedPlatform] = useState('all');

  const contentItems: ContentItem[] = [
    {
      id: '1',
      title: '5 Morning Habits That Changed My Life',
      platform: 'TikTok',
      status: 'scheduled',
      date: new Date(2024, 11, 15),
      time: '09:00',
      type: 'Video',
    },
    {
      id: '2',
      title: 'Client Success Story: Sarah',
      platform: 'LinkedIn',
      status: 'approved',
      date: new Date(2024, 11, 16),
      time: '14:00',
      type: 'Post',
    },
    {
      id: '3',
      title: 'Behind the Scenes: Office Tour',
      platform: 'Instagram',
      status: 'review',
      date: new Date(2024, 11, 17),
      time: '16:00',
      type: 'Reel',
    },
    {
      id: '4',
      title: 'Quick Productivity Hack',
      platform: 'Twitter',
      status: 'draft',
      date: new Date(2024, 11, 18),
      time: '11:00',
      type: 'Thread',
    },
    {
      id: '5',
      title: 'Weekly Industry Insights',
      platform: 'YouTube',
      status: 'published',
      date: new Date(2024, 11, 12),
      time: '19:00',
      type: 'Short',
      engagement: '12.5K views'
    },
  ];

  const platforms = ['all', 'TikTok', 'Instagram', 'YouTube', 'LinkedIn', 'Twitter'];
  const statusColors = {
    draft: 'bg-gray-100 text-gray-700 border-gray-300',
    review: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    approved: 'bg-blue-100 text-blue-700 border-blue-300',
    scheduled: 'bg-green-100 text-green-700 border-green-300',
    published: 'bg-purple-100 text-purple-700 border-purple-300',
  };

  const statusIcons = {
    draft: Circle,
    review: AlertCircle,
    approved: CheckCircle,
    scheduled: Clock,
    published: Eye,
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'TikTok': return 'bg-black text-white';
      case 'Instagram': return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white';
      case 'YouTube': return 'bg-red-500 text-white';
      case 'LinkedIn': return 'bg-blue-600 text-white';
      case 'Twitter': return 'bg-blue-400 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    while (days.length < 42) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  const getContentForDate = (date: Date) => {
    return contentItems.filter(item => 
      item.date.toDateString() === date.toDateString() &&
      (selectedPlatform === 'all' || item.platform === selectedPlatform)
    );
  };

  const renderKanbanView = () => {
    const statusGroups = {
      draft: contentItems.filter(item => item.status === 'draft'),
      review: contentItems.filter(item => item.status === 'review'),
      approved: contentItems.filter(item => item.status === 'approved'),
      scheduled: contentItems.filter(item => item.status === 'scheduled'),
      published: contentItems.filter(item => item.status === 'published'),
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {Object.entries(statusGroups).map(([status, items]) => {
          const StatusIcon = statusIcons[status as keyof typeof statusIcons];
          return (
            <div key={status} className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-4">
                <StatusIcon className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900 capitalize">{status}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-lg border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                        {item.title}
                      </h4>
                      <button className="text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-1 rounded-full ${getPlatformColor(item.platform)}`}>
                        {item.platform}
                      </span>
                      <span className="text-xs text-gray-500">
                        {item.date.toLocaleDateString()} {item.time}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderCalendarView = () => {
    const days = getDaysInMonth(currentDate);
    const today = new Date();

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 gap-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-4 bg-gray-50 border-b border-r border-gray-200 text-center font-medium text-gray-700">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === today.toDateString();
            const dayContent = getContentForDate(day);

            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-b border-r border-gray-200 ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                }`}
              >
                <div className={`text-sm font-medium mb-2 ${
                  isToday ? 'w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center' : 
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayContent.slice(0, 3).map(item => {
                    const StatusIcon = statusIcons[item.status];
                    return (
                      <div
                        key={item.id}
                        className={`text-xs p-1 rounded border ${statusColors[item.status]} cursor-pointer hover:shadow-sm transition-shadow`}
                        title={item.title}
                      >
                        <div className="flex items-center space-x-1">
                          <StatusIcon className="w-3 h-3 flex-shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                      </div>
                    );
                  })}
                  {dayContent.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{dayContent.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Calendar</h1>
            <p className="text-gray-600">Plan, schedule, and track your content</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Add Content</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {platforms.map(platform => (
              <option key={platform} value={platform}>
                {platform === 'all' ? 'All Platforms' : platform}
              </option>
            ))}
          </select>

          <div className="flex bg-gray-100 rounded-lg p-1">
            {['month', 'kanban'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as typeof viewMode)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'kanban' ? renderKanbanView() : renderCalendarView()}
    </div>
  );
};

export default ContentCalendar;