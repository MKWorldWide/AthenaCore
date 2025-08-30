# Contributing to AthenaCore

Thank you for your interest in contributing to AthenaCore! We welcome contributions from everyone. Here's how you can help:

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ (see [.nvmrc](.nvmrc))
- npm 9+
- PostgreSQL 13+
- Redis (for job queue)

### Setting Up for Development

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/AthenaCore.git
   cd AthenaCore
   ```
3. **Install dependencies**
   ```bash
   npm ci
   ```
4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```
5. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```

## 🔧 Development Workflow

### Running the Application
```bash
# Start development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

## 🛠 Making Changes

### Code Style
- Follow the existing code style
- Use TypeScript types wherever possible
- Keep functions small and focused
- Add appropriate comments and documentation

### Commit Message Format
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types**:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

### Pull Requests
1. Keep PRs small and focused on a single feature/fix
2. Update documentation as needed
3. Make sure all tests pass
4. Add tests for new features
5. Update the CHANGELOG.md if applicable
6. Request reviews from maintainers

## 🐛 Reporting Bugs

1. Check if the issue has already been reported
2. Open a new issue with a clear title and description
3. Include steps to reproduce the issue
4. Add any relevant logs or screenshots

## 📝 Feature Requests

1. Check if the feature has already been requested
2. Open a new issue with a clear description of the feature
3. Explain why this feature would be useful
4. Include any relevant examples or mockups

## 📜 Code of Conduct

Please note that this project is released with a [Contributor Code of Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to abide by its terms.

## 🙏 Thank You!

Your contributions make AthenaCore better for everyone. Thank you for taking the time to contribute!
