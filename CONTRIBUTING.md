# Contributing to 10-Date Platform

Thank you for your interest in contributing to the 10-Date Platform! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for everyone.

## How to Contribute

### Reporting Bugs

Before submitting a bug report, please check if the issue has already been reported. If not, create a new issue using the bug report template.

When filing a bug report, please include:
- A clear and descriptive title
- Detailed steps to reproduce the issue
- Expected behavior and what actually happened
- Screenshots if applicable
- Environment details (OS, browser, device, etc.)

### Suggesting Features

Feature suggestions are tracked as GitHub issues. When suggesting a feature:
- Use the feature request template
- Provide a clear description of the feature
- Explain the use case and benefits
- Include any relevant examples or mockups

### Pull Requests

1. Fork the repository
2. Create a new branch from `main` for your feature or bugfix
   - Use descriptive branch names (e.g., `feature/add-profile-verification` or `fix/login-error`)
3. Make your changes
4. Ensure your code follows the project's coding standards
5. Write or update tests as needed
6. Update documentation if necessary
7. Submit a pull request to the `main` branch

### Pull Request Process

1. Ensure your PR description clearly describes the changes
2. Link any related issues in the PR description
3. Make sure all tests pass
4. Request a review from maintainers
5. Address review feedback if requested

## Development Setup

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Docker and Docker Compose
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)

### Local Setup

1. Clone your fork of the repository
2. Run `./scripts/local-setup.sh` to set up the development environment
3. Refer to README.md for additional setup instructions

## Coding Standards

### General Guidelines

- Write clean, readable, and maintainable code
- Follow the existing code style and patterns
- Document complex logic and public APIs
- Keep commits focused and atomic

### JavaScript/TypeScript

- Follow ESLint and Prettier configurations
- Use TypeScript types/interfaces for better type safety
- Write meaningful variable and function names
- Add JSDoc comments for functions and classes

### Testing

- Write unit tests for new functionality
- Ensure existing tests pass
- Consider edge cases in your tests

## License

By contributing to this project, you agree that your contributions will be licensed under the project's license.

## Questions?

If you have any questions or need help, please reach out to the maintainers or open an issue for discussion.
