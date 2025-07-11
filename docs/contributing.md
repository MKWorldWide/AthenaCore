# Contributing to AthenaCore

Thank you for your interest in contributing to AthenaCore! This document provides guidelines and information for contributors.

## 🌟 Getting Started

### Prerequisites

- Node.js >= 18.x
- TypeScript >= 5.x
- npm >= 9.x
- Git

### Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/yourusername/athenacore.git
   cd athenacore
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Run tests to ensure everything works**
   ```bash
   npm test
   ```

## 🚀 Development Workflow

### 1. Create a Feature Branch

```bash
git checkout -b feature/amazing-feature
```

### 2. Make Your Changes

- Follow the coding standards (see below)
- Add tests for new functionality
- Update documentation as needed

### 3. Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test suites
npm test -- --testPathPattern=module-name
```

### 4. Check Code Quality

```bash
# Run linter
npm run lint

# Fix linting issues automatically
npm run lint:fix
```

### 5. Build the Project

```bash
npm run build
```

### 6. Commit Your Changes

```bash
git add .
git commit -m "feat: add amazing feature

- Add new functionality for pattern recognition
- Include comprehensive tests
- Update documentation"
```

### 7. Push and Create Pull Request

```bash
git push origin feature/amazing-feature
```

Then create a Pull Request on GitHub.

## 📝 Coding Standards

### TypeScript

- Use strict TypeScript configuration
- Prefer interfaces over types for object shapes
- Use proper type annotations
- Avoid `any` type when possible

### Code Style

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Use camelCase for variables and functions
- Use PascalCase for classes and interfaces
- Use UPPER_SNAKE_CASE for constants

### Documentation

- Add JSDoc comments for all public APIs
- Include examples in documentation
- Update README.md for user-facing changes
- Update CHANGELOG.md for significant changes

### Testing

- Write tests for all new functionality
- Aim for >90% test coverage
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

## 🧪 Testing Guidelines

### Test Structure

```typescript
describe('ModuleName', () => {
  describe('methodName', () => {
    it('should do something when condition is met', async () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = await module.methodName(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
    
    it('should throw error when invalid input is provided', async () => {
      // Arrange
      const invalidInput = null;
      
      // Act & Assert
      await expect(module.methodName(invalidInput)).rejects.toThrow();
    });
  });
});
```

### Mocking

```typescript
// Mock external dependencies
jest.mock('axios');
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock internal modules
jest.mock('@/lib/athenacore/modules/llm');
```

## 🔧 Module Development

### Creating a New Module

1. **Create module directory**
   ```bash
   mkdir -p src/lib/athenacore/modules/newmodule
   ```

2. **Create module files**
   ```typescript
   // index.ts
   export * from './newmodule';
   export * from './types';
   
   // newmodule.ts
   export class NewModule {
     // Implementation
   }
   
   // types.ts
   export interface NewModuleConfig {
     // Configuration interface
   }
   ```

3. **Add tests**
   ```bash
   mkdir -p src/lib/athenacore/modules/newmodule/__tests__
   ```

4. **Update configuration**
   - Add to `src/config/athenacore.ts`
   - Update `DEFAULT_CONFIG`

5. **Update initialization**
   - Add to `src/lib/athenacore/init.ts`

### Module Guidelines

- Use EventEmitter for event-driven communication
- Implement proper error handling
- Add comprehensive logging
- Include performance monitoring
- Follow the established patterns

## 📚 Documentation

### API Documentation

- Use JSDoc for all public methods
- Include parameter descriptions
- Provide usage examples
- Document return types

### README Updates

- Update installation instructions if needed
- Add usage examples for new features
- Update configuration examples
- Include breaking changes

### Changelog

- Add entries for all user-facing changes
- Use conventional commit format
- Include migration guides for breaking changes

## 🐛 Bug Reports

### Before Submitting

1. Check existing issues
2. Try to reproduce the bug
3. Check if it's a configuration issue
4. Test with latest version

### Bug Report Template

```markdown
**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Node.js version: [e.g. 18.17.0]
- AthenaCore version: [e.g. 2.0.0]

**Additional context**
Add any other context about the problem here.
```

## 💡 Feature Requests

### Before Submitting

1. Check existing feature requests
2. Consider if it fits the project scope
3. Think about implementation complexity
4. Consider backward compatibility

### Feature Request Template

```markdown
**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is.

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions.

**Additional context**
Add any other context or screenshots about the feature request.
```

## 🔄 Pull Request Process

### Before Submitting

1. **Ensure tests pass**
   ```bash
   npm test
   npm run test:coverage
   ```

2. **Check code quality**
   ```bash
   npm run lint
   npm run build
   ```

3. **Update documentation**
   - Update README.md if needed
   - Update API documentation
   - Update CHANGELOG.md

4. **Write a good description**
   - Describe what the PR does
   - Include any breaking changes
   - Reference related issues

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] All tests pass
- [ ] New tests added for new functionality
- [ ] Coverage maintained or improved

## Checklist
- [ ] Code follows the style guidelines
- [ ] Self-review of code completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] No breaking changes (or breaking changes documented)
```

## 🏷️ Release Process

### Versioning

We use [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes, backward compatible

### Release Steps

1. **Update version**
   ```bash
   npm version [major|minor|patch]
   ```

2. **Update CHANGELOG.md**
   - Add release notes
   - Include migration guide if needed

3. **Create release**
   - Create GitHub release
   - Tag the release
   - Publish to npm

## 🤝 Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Help others learn and grow
- Provide constructive feedback
- Follow the project's coding standards

### Communication

- Use GitHub Issues for bug reports and feature requests
- Use GitHub Discussions for questions and ideas
- Be clear and concise in communications
- Provide context and examples

## 📞 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Documentation**: Check the docs/ directory
- **Examples**: Check the examples/ directory

## 🙏 Acknowledgments

Thank you for contributing to AthenaCore! Your contributions help make this project better for everyone.

---

**Happy coding! 🚀** 