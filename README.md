# CTF Platform

A full-featured Capture The Flag platform with dynamic challenges, real-time scoring, team management, and automated challenge deployment.

## Features

- 🔐 **User Authentication & Authorization** - JWT-based auth with role-based access
- 👥 **Team Management** - Create teams, invite members, manage permissions
- 🎯 **Dynamic Challenges** - Support for multiple challenge categories (Web, Crypto, Reverse, Forensics, etc.)
- 📊 **Real-time Scoring** - Live leaderboards with Socket.io
- 🚀 **Automated Deployment** - Docker containers with Kubernetes orchestration
- 🏆 **Competition Management** - Start/stop competitions, manage time windows
- 🔍 **Challenge Validation** - Automated flag submission and scoring
- 📈 **Analytics Dashboard** - Admin panel with competition statistics

## Tech Stack

- **Backend**: Node.js, Express.js, Socket.io
- **Frontend**: React, Material-UI, Axios
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens with bcrypt
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes
- **Development**: ESLint, Prettier, Nodemon

## Project Structure

```
ctf-platform/
├── backend/                 # Express.js API server
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── config/            # Configuration files
│   └── app.js             # Main application file
├── frontend/              # React application
│   ├── public/            # Static files
│   ├── src/               # Source code
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Utility functions
├── database/              # Database configurations
│   ├── migrations/        # Database migrations
│   ├── seeders/          # Database seeds
│   └── config.js         # Database config
├── docker/               # Docker configurations
│   ├── backend/          # Backend Dockerfile
│   ├── frontend/         # Frontend Dockerfile
│   └── docker-compose.yml
├── k8s/                  # Kubernetes manifests
│   ├── backend/          # Backend K8s configs
│   ├── frontend/         # Frontend K8s configs
│   └── database/         # Database K8s configs
├── challenges/           # Challenge definitions
│   ├── web/              # Web challenges
│   ├── crypto/           # Cryptography challenges
│   ├── reverse/          # Reverse engineering
│   └── forensics/        # Digital forensics
└── docs/                 # Documentation
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- MySQL 8.0+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ctf-platform
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Copy environment templates
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   
   # Edit the .env files with your configuration
   ```

4. **Setup database**
   ```bash
   # Start MySQL with Docker
   docker-compose up -d mysql
   
   # Run migrations
   cd backend
   npm run migrate
   npm run seed
   ```

5. **Start development servers**
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

### Docker Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Deployment

```bash
# Build and deploy with Kubernetes
kubectl apply -f k8s/
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Challenge Endpoints

- `GET /api/challenges` - List all challenges
- `GET /api/challenges/:id` - Get challenge details
- `POST /api/challenges/:id/submit` - Submit flag
- `GET /api/challenges/categories` - Get challenge categories

### Team Endpoints

- `POST /api/teams` - Create team
- `GET /api/teams/:id` - Get team details
- `POST /api/teams/:id/join` - Join team
- `DELETE /api/teams/:id/leave` - Leave team

### Scoring Endpoints

- `GET /api/scoreboard` - Get current scoreboard
- `GET /api/scores/team/:id` - Get team scores
- `GET /api/scores/user/:id` - Get user scores

## Environment Variables

### Backend (.env)

```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ctf_platform
DB_USER=root
DB_PASSWORD=password
JWT_SECRET=your-secret-key
JWT_EXPIRE=24h
ADMIN_EMAIL=admin@ctf.local
ADMIN_PASSWORD=admin123
```

### Frontend (.env)

```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Security

If you discover any security vulnerabilities, please email security@ctf.local instead of using the issue tracker.