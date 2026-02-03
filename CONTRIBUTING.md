# Contributing to Pollysider

Thank you for considering contributing to Pollysider! 🎉

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if UI related)
- Environment details (OS, Node version, browser)

### Suggesting Features

Feature requests are welcome! Please include:
- Clear use case
- Expected behavior
- Why this would be valuable
- Any implementation ideas

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes**
4. **Test thoroughly** (both backend and frontend)
5. **Commit with clear messages** (`git commit -m 'Add amazing feature'`)
6. **Push to your fork** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Code Style

- **TypeScript**: Use strict typing, avoid `any`
- **Formatting**: Use 2-space indentation
- **Comments**: Explain "why", not "what"
- **Naming**: Use descriptive variable names

### Testing

Before submitting:
- Run `npm run dev` in both backend and frontend
- Test your changes manually
- Check browser console for errors
- Verify WebSocket connection works

### Development Setup

```bash
# Install dependencies
npm install
cd backend && npm install
cd ../frontend && npm install

# Start development servers
npm run dev
```

### Areas That Need Help

- [ ] Unit tests (backend detection logic)
- [ ] Integration tests (WebSocket reliability)
- [ ] Performance optimization (memory usage)
- [ ] UI/UX improvements
- [ ] Documentation (code comments, tutorials)
- [ ] Bug fixes

## Questions?

Open a GitHub Discussion or issue - we're here to help!

---

**Thank you for making Pollysider better!** 💪
