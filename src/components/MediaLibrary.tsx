import React, { useState } from 'react';
import {
  Image,
  Video,
  Upload,
  Search,
  Filter,
  Grid3x3,
  List,
  Download,
  Share,
  Trash2,
  Edit,
  Tag,
  Calendar,
  Eye,
} from 'lucide-react';

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: string;
  url: string;
  uploadDate: string;
  tags: string[];
  project?: string;
  dimensions?: string;
  duration?: string;
}

const MediaLibrary: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const mediaItems: MediaItem[] = [
    {
      id: '1',
      name: 'morning-routine-hero.jpg',
      type: 'image',
      size: '2.4 MB',
      url: 'https://images.pexels.com/photos/6001558/pexels-photo-6001558.jpeg',
      uploadDate: '2024-12-15',
      tags: ['morning', 'wellness', 'lifestyle'],
      project: 'Wellness Co.',
      dimensions: '1920x1080',
    },
    {
      id: '2',
      name: 'business-meeting-video.mp4',
      type: 'video',
      size: '15.2 MB',
      url: 'https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg',
      uploadDate: '2024-12-14',
      tags: ['business', 'meeting', 'professional'],
      project: 'TechStart',
      dimensions: '1920x1080',
      duration: '0:45',
    },
    {
      id: '3',
      name: 'ai-tools-screenshot.png',
      type: 'image',
      size: '1.8 MB',
      url: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg',
      uploadDate: '2024-12-13',
      tags: ['ai', 'technology', 'tools'],
      project: 'TechStart',
      dimensions: '1920x1080',
    },
    {
      id: '4',
      name: 'outfit-transition.jpg',
      type: 'image',
      size: '3.1 MB',
      url: 'https://images.pexels.com/photos/1065084/pexels-photo-1065084.jpeg',
      uploadDate: '2024-12-12',
      tags: ['fashion', 'style', 'transition'],
      project: 'Fashion Forward',
      dimensions: '1080x1920',
    },
    {
      id: '5',
      name: 'productivity-workspace.jpg',
      type: 'image',
      size: '2.7 MB',
      url: 'https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg',
      uploadDate: '2024-12-11',
      tags: ['productivity', 'workspace', 'setup'],
      project: 'Personal',
      dimensions: '1920x1080',
    },
    {
      id: '6',
      name: 'meal-prep-video.mp4',
      type: 'video',
      size: '22.5 MB',
      url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
      uploadDate: '2024-12-10',
      tags: ['food', 'meal-prep', 'healthy'],
      project: 'Wellness Co.',
      dimensions: '1080x1920',
      duration: '1:20',
    },
  ];

  const projects = ['all', 'Wellness Co.', 'TechStart', 'Fashion Forward', 'Personal'];
  const mediaTypes = ['all', 'image', 'video', 'document'];

  const filteredMedia = mediaItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesProject = selectedProject === 'all' || item.project === selectedProject;
    
    return matchesSearch && matchesType && matchesProject;
  });

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      default: return <Image className="w-5 h-5" />;
    }
  };

  const formatFileSize = (size: string) => {
    return size;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
            <Image className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600">Organize and manage your content assets</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:shadow-md transition-all duration-200 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>Upload Media</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by filename or tags..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {mediaTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              {projects.map(project => (
                <option key={project} value={project}>
                  {project === 'all' ? 'All Projects' : project}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <p className="text-sm text-gray-600">
            {filteredMedia.length} items
            {selectedItems.length > 0 && (
              <span className="ml-2">• {selectedItems.length} selected</span>
            )}
          </p>
          {selectedItems.length > 0 && (
            <div className="flex items-center space-x-2">
              <button className="text-gray-600 hover:text-blue-600 transition-colors">
                <Share className="w-4 h-4" />
              </button>
              <button className="text-gray-600 hover:text-green-600 transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button className="text-gray-600 hover:text-red-600 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Media Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer transition-all duration-200 group hover:shadow-lg ${
                selectedItems.includes(item.id) ? 'border-teal-300 ring-2 ring-teal-100' : 'border-gray-100'
              }`}
              onClick={() => toggleSelection(item.id)}
            >
              <div className="relative aspect-video bg-gray-100 overflow-hidden">
                <img
                  src={item.url}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {item.type === 'video' && item.duration && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {item.duration}
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <div className="w-6 h-6 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    {getFileIcon(item.type)}
                  </div>
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="font-medium text-gray-900 text-sm mb-2 truncate">{item.name}</h3>
                <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
                  <span>{formatFileSize(item.size)}</span>
                  {item.dimensions && <span>{item.dimensions}</span>}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span className="text-gray-500">{item.uploadDate}</span>
                  </div>
                  {item.project && (
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                      {item.project}
                    </span>
                  )}
                </div>
                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 2).map((tag, index) => (
                      <span
                        key={index}
                        className="bg-teal-100 text-teal-700 text-xs px-2 py-1 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                    {item.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{item.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(filteredMedia.map(item => item.id));
                        } else {
                          setSelectedItems([]);
                        }
                      }}
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMedia.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${
                      selectedItems.includes(item.id) ? 'bg-teal-50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        className="rounded border-gray-300"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleSelection(item.id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          {getFileIcon(item.type)}
                        </div>
                        <div className="font-medium text-gray-900">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600 capitalize">{item.type}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{formatFileSize(item.size)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                        {item.project || 'Unassigned'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-gray-600">{item.uploadDate}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-blue-600 transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-green-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Area */}
      {filteredMedia.length === 0 && !searchTerm && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No media files yet</h3>
          <p className="text-gray-600 mb-4">Upload your first media files to get started</p>
          <button className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200">
            Upload Media
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaLibrary;