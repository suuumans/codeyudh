# CodeYudh - Competitive Programming Platform

## Overview

CodeYudh is a competitive programming platform where coders can engage in "yudh" (war) - battling with code and challenging others. The name combines "Code" with the Sanskrit word "Yudh" (युद्ध) meaning war or battle, representing the competitive nature of the platform.

## Project Structure

The project consists of two main components:

### Backend (Server)

- **Technology Stack**:
  - [Bun](https://bun.sh) - JavaScript runtime & package manager
  - [Express](https://expressjs.com/) - Web framework
  - [PostgreSQL](https://www.postgresql.org/) - Database
  - [Drizzle ORM](https://orm.drizzle.team/) - Database ORM
  - [JSON Web Token](https://jwt.io/) - Authentication

### Frontend (Client)

- **Technology Stack**:
  - [React](https://reactjs.org/) - UI library
  - [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
  - [Vite](https://vitejs.dev/) - Build tool & development server

## Features

- **User Authentication**: Register, login, email verification
- **Problem Repository**: Curated coding problems with varying difficulty levels (EASY, MEDIUM, HARD)
- **Code Editor**: In-browser code editor with support for multiple languages
- **Code Execution**: Integration with Judge0 API for code execution
- **Test Cases**: Run your solution against predefined test cases
- **Submissions**: Track submission history and performance
- **User Profiles**: Monitor progress and achievements
- **Playlists**: Organize problems into themed collections

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (v1.1.26 or higher)
- [Docker](https://www.docker.com/) for PostgreSQL
- [Node.js](https://nodejs.org/) (v18 or higher)

### Setting Up the Database

```bash
docker run --name codeyudh-db -e POSTGRES_USER=name -e POSTGRES_PASSWORD=yourpassword -e POSTGRES_DB=postgres -p 5432:5432 -d postgres
```

### Setting Up the Server

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/codeyudh.git
   cd codeyudh/server
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   Create a `.env` file in the server directory with the following:
   ```
   DB_URI=postgresql:yourusername:mypassword@localhost:5432/postgres
   ACCESS_TOKEN_SECRET=your_secret_key
   JUDGE0_API_URL=https://judge0-instance-url/api
   MAILTRAP_SMTP_HOST=smtp.mailtrap.io
   MAILTRAP_SMTP_PORT=PORT
   MAILTRAP_SMTP_USER=your_mailtrap_user
   MAILTRAP_SMTP_PASS=your_mailtrap_password
   MAILTRAP_FROM=noreply@codeyudh.com
   ```

4. Run database migrations:
   ```bash
   bunx drizzle-kit generate
   bunx drizzle-kit migrate
   ```

5. Start the server:
   ```bash
   bun run start
   ```

### Setting Up the Client

1. Navigate to the client directory:
   ```bash
   cd ../client
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun run dev
   ```

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login an existing user
- `GET /api/v1/auth/verify/:token` - Verify email address

### Problems

- `GET /api/v1/problems` - Get all problems
- `GET /api/v1/problems/:id` - Get specific problem details
- `POST /api/v1/problems` - Create a new problem (admin only)
- `PUT /api/v1/problems/:id` - Update a problem (admin only)

### Code Execution

- `POST /api/v1/exicute-code` - Execute code against test cases

### Submissions

- `POST /api/v1/submission` - Submit a solution for a problem
- `GET /api/v1/submission/user/:userId` - Get all submissions by a user
- `GET /api/v1/submission/problem/:problemId` - Get all submissions for a problem

### Playlists

- `GET /api/v1/playlist` - Get all playlists
- `POST /api/v1/playlist` - Create a new playlist
- `PUT /api/v1/playlist/:id` - Update a playlist

## Database Schema

The application uses a PostgreSQL database with the following key tables:

- **Users**: Store user information and authentication data
- **Problems**: Coding problems with descriptions, difficulty levels, and test cases
- **Submissions**: User code submissions for problems
- **TestCaseResults**: Results of running user submissions against test cases
- **ProblemSolved**: Tracks which problems users have successfully solved
- **Playlists**: Collections of problems grouped by theme or difficulty

## Project Status

CodeYudh is currently in active development.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT License](LICENSE)

---
[Suman Sarkar](https://x.com/suuumans)