# ContentFlow AI Backend

A comprehensive backend API for ContentFlow AI - a modern SaaS platform that blends AI, trend-tracking, and collaboration tools to streamline content creation, social strategy, and client workflows.

## 🚀 Features

- **Multi-role Authentication**: Admin, Agency, Creator, and Client roles with JWT-based auth
- **AI Content Generation**: OpenAI GPT-4 integration for hooks, scripts, captions, and hashtags
- **Real-time Collaboration**: Supabase real-time subscriptions for content approval workflows
- **Trend Tracking**: API endpoints for trending content, hashtags, and formats
- **Social Media Integration**: OAuth flows for TikTok, Instagram, YouTube, LinkedIn, Twitter
- **File Management**: Supabase storage for media files and assets
- **Analytics Dashboard**: Social media metrics aggregation and AI insights
- **Client Portal**: Agency-client collaboration with approval workflows

## 🛠 Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + JWT
- **File Storage**: Supabase Storage
- **Real-time**: Supabase Subscriptions
- **AI**: OpenAI GPT-4
- **Email**: SendGrid
- **Documentation**: Swagger/OpenAPI

## 📋 Prerequisites

- Node.js 18+ 
- Supabase account and project
- OpenAI API key
- Social media API credentials (optional)
- SendGrid account (optional)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd contentflow-ai-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Server Configuration
   NODE_ENV=development
   PORT=3001
   FRONTEND_URL=https://content-flow-ai.netlify.app

   # Supabase Configuration
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_here

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key

   # Social Media API Keys (optional)
   META_APP_ID=your_meta_app_id
   META_APP_SECRET=your_meta_app_secret
   TIKTOK_CLIENT_KEY=your_tiktok_client_key
   TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
   # ... other API keys
   ```

4. **Set up Supabase database**
   
   Run the migration files in your Supabase SQL editor:
   ```bash
   # Copy the contents of supabase/migrations/001_initial_schema.sql
   # and run it in your Supabase SQL editor
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3001`

## 📚 API Documentation

Once the server is running, visit `http://localhost:3001/api-docs` for interactive API documentation.

### Core Endpoints

#### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

#### Content Management
- `GET /api/content` - Get content items
- `POST /api/content` - Create content item
- `PUT /api/content/:id` - Update content item
- `DELETE /api/content/:id` - Delete content item
- `POST /api/content/:id/comments` - Add comment/approval

#### AI Generation
- `POST /api/ai/generate` - Generate AI content
- `GET /api/ai/templates` - Get prompt templates
- `GET /api/ai/history` - Get generation history

#### Trends & Research
- `GET /api/trends` - Get trending data
- `GET /api/trends/hashtags` - Get trending hashtags
- `POST /api/hashtags/research` - Research hashtags
- `GET /api/hashtags/packs` - Get hashtag packs

#### Social Media
- `GET /api/social/connect/:platform` - OAuth connection
- `GET /api/analytics/overview` - Analytics dashboard
- `POST /api/files/upload` - Upload media files

## 🔐 Authentication & Authorization

The API uses JWT-based authentication with role-based access control:

### User Roles
- **Admin**: Full system access
- **Agency**: Manage multiple clients and team members
- **Creator**: Create and manage content
- **Client**: View and approve content

### Protected Routes
All API routes (except auth endpoints) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## 🗄 Database Schema

The database includes the following main tables:

- `users` - User accounts and profiles
- `workspaces` - Agency workspaces
- `clients` - Client information and settings
- `content_items` - Content pieces with status tracking
- `content_comments` - Approval workflow and feedback
- `hashtag_packs` - Saved hashtag collections
- `ai_generations` - AI content generation history
- `trending_data` - Cached trending content
- `social_accounts` - Connected social media accounts
- `analytics_data` - Social media metrics

## 🤖 AI Integration

### OpenAI GPT-4 Features
- **Content Generation**: Hooks, scripts, captions, hashtags
- **Trend Analysis**: Content format suggestions
- **Brand Voice**: Personalized content based on client preferences

### Usage Example
```javascript
POST /api/ai/generate
{
  "prompt": "Create 5 hooks for a fitness coach about morning workouts",
  "type": "hook",
  "platform": "tiktok",
  "tone": "motivational",
  "niche": "fitness"
}
```

## 📱 Social Media Integration

### Supported Platforms
- TikTok (OAuth + Analytics)
- Instagram (OAuth + Analytics)
- YouTube (OAuth + Analytics)
- LinkedIn (OAuth + Analytics)
- Twitter (OAuth + Analytics)

### OAuth Flow
1. Frontend redirects to `/api/social/connect/:platform`
2. User authorizes on platform
3. Backend stores access tokens securely
4. Analytics data is fetched and cached

## 📊 Real-time Features

Using Supabase real-time subscriptions for:
- Content approval notifications
- Comment updates
- Calendar changes
- Team collaboration

## 🚀 Deployment

### Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Set environment variables in Vercel dashboard

### Railway
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

### Docker
```bash
docker build -t contentflow-api .
docker run -p 3001:3001 contentflow-api
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | JWT signing secret | Yes |
| `OPENAI_API_KEY` | OpenAI API key | Yes |
| `META_APP_ID` | Meta/Facebook app ID | No |
| `TIKTOK_CLIENT_KEY` | TikTok client key | No |
| `SENDGRID_API_KEY` | SendGrid API key | No |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@contentflow-ai.com or create an issue in the repository.

## 🔄 API Versioning

Current API version: `v1`
All endpoints are prefixed with `/api/`

## 📈 Performance

- Rate limiting: 100 requests per 15 minutes per IP
- Response caching for trending data
- Database query optimization with indexes
- File upload limits: 10MB per file

## 🔒 Security

- JWT token expiration: 7 days
- Password hashing: bcrypt with 12 rounds
- SQL injection protection: Parameterized queries
- CORS configuration for frontend domains
- Helmet.js for security headers