# CTF Platform - Copilot Instructions

This is a full-featured Capture The Flag (CTF) platform built with modern web technologies.

## Tech Stack
- **Backend**: Node.js with Express.js framework
- **Frontend**: React with modern hooks and components
- **Database**: MySQL for persistent data storage
- **Real-time**: Socket.io for live updates and scoring
- **Containerization**: Docker for all services
- **Orchestration**: Kubernetes for production deployment
- **Authentication**: JWT tokens with bcrypt password hashing

## Project Structure
- `/backend` - Express.js API server with authentication and challenge management
- `/frontend` - React application with responsive UI
- `/database` - MySQL schemas and migrations
- `/docker` - Docker configurations for all services
- `/k8s` - Kubernetes manifests for production deployment
- `/challenges` - Dynamic challenge definitions and deployment scripts

## Key Features
- Dynamic challenge deployment and management
- Real-time scoring and leaderboards
- Team registration and management
- User authentication and authorization
- Challenge categories (Web, Crypto, Reverse, Forensics, etc.)
- Flag submission validation
- Admin dashboard for platform management
- Automated challenge environment provisioning

## Development Guidelines
- Follow RESTful API design principles
- Use async/await for asynchronous operations
- Implement proper error handling and validation
- Use environment variables for configuration
- Write modular, reusable components
- Implement proper security measures (input sanitization, rate limiting)
- Use Docker for consistent development environments