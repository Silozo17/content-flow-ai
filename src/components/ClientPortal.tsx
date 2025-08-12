import React, { useState } from 'react';
import {
  Users,
  Plus,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Upload,
  Calendar,
  FileText,
  Star,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  brand: string;
  avatar: string;
  status: 'active' | 'pending' | 'paused';
  contentCount: number;
  lastActivity: string;
  approvalRate: string;
}

interface ContentItem {
  id: string;
  clientId: string;
  title: string;
  type: string;
  status: 'pending' | 'approved' | 'rejected' | 'in-review';
  createdAt: string;
  feedback?: string;
  platform: string;
}

const ClientPortal: React.FC = () => {
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'feedback'>('overview');

  const clients: Client[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      brand: 'Wellness Co.',
      avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?w=100',
      status: 'active',
      contentCount: 24,
      lastActivity: '2 hours ago',
      approvalRate: '94%',
    },
    {
      id: '2',
      name: 'Mike Chen',
      brand: 'TechStart',
      avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?w=100',
      status: 'active',
      contentCount: 18,
      lastActivity: '1 day ago',
      approvalRate: '87%',
    },
    {
      id: '3',
      name: 'Emma Davis',
      brand: 'Fashion Forward',
      avatar: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg?w=100',
      status: 'pending',
      contentCount: 12,
      lastActivity: '3 days ago',
      approvalRate: '92%',
    },
    {
      id: '4',
      name: 'David Wilson',
      brand: 'Fitness Pro',
      avatar: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?w=100',
      status: 'active',
      contentCount: 31,
      lastActivity: '4 hours ago',
      approvalRate: '89%',
    },
  ];

  const contentItems: ContentItem[] = [
    {
      id: '1',
      clientId: '1',
      title: '5 Morning Wellness Tips',
      type: 'Video',
      status: 'pending',
      createdAt: '2024-12-15',
      platform: 'TikTok',
    },
    {
      id: '2',
      clientId: '1',
      title: 'Client Success Story',
      type: 'Carousel',
      status: 'approved',
      createdAt: '2024-12-14',
      platform: 'Instagram',
      feedback: 'Love the authentic approach! Perfect for our brand voice.',
    },
    {
      id: '3',
      clientId: '2',
      title: 'Tech Innovation Trends',
      type: 'Video',
      status: 'in-review',
      createdAt: '2024-12-13',
      platform: 'YouTube',
    },
    {
      id: '4',
      clientId: '1',
      title: 'Behind the Scenes',
      type: 'Story',
      status: 'rejected',
      createdAt: '2024-12-12',
      platform: 'Instagram',
      feedback: 'Could we adjust the lighting and add more brand elements?',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'paused': return 'bg-gray-100 text-gray-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'rejected': return 'bg-red-100 text-red-700';
      case 'in-review': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'pending':
      case 'in-review': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const selectedClientData = clients.find(c => c.id === selectedClient);
  const clientContent = contentItems.filter(item => item.clientId === selectedClient);

  if (!selectedClient) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Client Portal</h1>
              <p className="text-gray-600">Manage client relationships and content approval</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Client</span>
            </button>
          </div>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client.id)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-lg cursor-pointer transition-all duration-200 group"
            >
              <div className="flex items-center space-x-4 mb-4">
                <img
                  src={client.avatar}
                  alt={client.name}
                  className="w-16 h-16 rounded-full object-cover border-4 border-gray-100 group-hover:border-indigo-200 transition-colors"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {client.name}
                  </h3>
                  <p className="text-gray-600">{client.brand}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(client.status)}`}>
                    {client.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Content</p>
                  <p className="font-semibold text-gray-900">{client.contentCount} posts</p>
                </div>
                <div>
                  <p className="text-gray-600">Approval Rate</p>
                  <p className="font-semibold text-green-600">{client.approvalRate}</p>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">Last activity: {client.lastActivity}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setSelectedClient(null)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <div className="w-0 h-0 border-t-4 border-b-4 border-r-6 border-transparent border-r-gray-600"></div>
          </button>
          <div className="flex items-center space-x-3">
            <img
              src={selectedClientData!.avatar}
              alt={selectedClientData!.name}
              className="w-12 h-12 rounded-full object-cover border-4 border-gray-100"
            />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedClientData!.name}</h1>
              <p className="text-gray-600">{selectedClientData!.brand}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-2">
            <MessageSquare className="w-4 h-4" />
            <span>Message</span>
          </button>
          <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>New Content</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: Eye },
            { id: 'content', label: 'Content', icon: FileText },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">Total Content</p>
                <p className="text-2xl font-bold text-gray-900">{selectedClientData!.contentCount}</p>
                <p className="text-green-600 text-sm mt-1">+3 this week</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">Approval Rate</p>
                <p className="text-2xl font-bold text-gray-900">{selectedClientData!.approvalRate}</p>
                <p className="text-green-600 text-sm mt-1">Excellent</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Star className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
                <p className="text-gray-600 text-sm">Avg. Rating</p>
                <p className="text-2xl font-bold text-gray-900">4.8</p>
                <p className="text-green-600 text-sm mt-1">Highly satisfied</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Approved "Client Success Story"</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Upload className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Uploaded new brand assets</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900">Left feedback on "Behind the Scenes"</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedClientData!.status)}`}>
                    {selectedClientData!.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Last Activity</p>
                  <p className="text-sm text-gray-900">{selectedClientData!.lastActivity}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Brand</p>
                  <p className="text-sm text-gray-900">{selectedClientData!.brand}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Schedule Meeting</span>
                  </div>
                </button>
                <button className="w-full bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Upload Files</span>
                  </div>
                </button>
                <button className="w-full bg-gray-50 hover:bg-gray-100 p-3 rounded-lg text-left transition-colors">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-700">Generate Report</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="space-y-6">
          {/* Content Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900">Content Items</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Content
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clientContent.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">{item.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">{item.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">{item.platform}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-gray-600">{item.createdAt}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* Feedback Items */}
          <div className="space-y-4">
            {clientContent
              .filter(item => item.feedback)
              .map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.title}</h4>
                      <p className="text-sm text-gray-600">{item.platform} • {item.createdAt}</p>
                    </div>
                    <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      <span className="ml-1">{item.status}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 italic">"{item.feedback}"</p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;