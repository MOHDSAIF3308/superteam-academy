# Superteam Academy Platform 🚀

**Interactive Solana Development Learning Platform**

Production-ready platform for teaching Solana development through interactive, hands-on courses with gamification and on-chain credentials.

[![Tests](https://github.com/solanabr/solana-academy-platform/actions/workflows/frontend-tests.yml/badge.svg)](https://github.com/solanabr/solana-academy-platform/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## 📚 Documentation

Start here to understand the project:

| Document | Purpose |
| --- | --- |
| [**CLAUDE.md**](CLAUDE.md) | Project overview & AI assistant context |
| [**docs/SPECIFICATION.md**](docs/SPECIFICATION.md) | Feature specifications & requirements |
| [**docs/ARCHITECTURE.md**](docs/ARCHITECTURE.md) | System design & data flows |
| [**docs/QUICKSTART.md**](docs/QUICKSTART.md) | Setup instructions |
| [**.claude/skills/SKILL.md**](.claude/skills/SKILL.md) | Frontend development guide |

## 🚀 Quick Start

**Prerequisites**: Node.js 20+, npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/solanabr/solana-academy-platform.git
cd solana-academy-platform
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your settings (defaults work for local dev)
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
.
├── app/                         ← Next.js app directory (routes)
│   ├── courses/                ← Course browsing & lessons
│   ├── dashboard/              ← User dashboard
│   ├── profile/                ← User profile
│   ├── leaderboard/            ← Rankings
│   ├── settings/               ← User preferences
│   └── layout.tsx              ← Root layout
├── components/
│   ├── courses/                ← Course-related components
│   ├── dashboard/              ← Dashboard widgets
│   ├── editor/                 ← Code editor & challenge runner
│   ├── layout/                 ← Header & Footer
│   └── ui/                     ← Base UI components
├── lib/
│   ├── hooks/                  ← Custom React hooks
│   ├── services/               ← API & business logic
│   ├── i18n/                   ← Internationalization
│   ├── types/                  ← TypeScript interfaces
│   └── utils/                  ← Helper functions
├── docs/                       ← Project documentation
│   ├── SPECIFICATION.md        ← Feature specs
│   ├── ARCHITECTURE.md         ← System design
│   └── IMPLEMENTATION_ORDER.md ← Phased plan
├── .claude/                    ← AI assistant configuration
│   ├── agents/                 ← AI agent profiles
│   ├── commands/               ← Automated workflows
│   ├── rules/                  ← Code quality standards
│   └── skills/                 ← Development guides
├── .github/
│   └── workflows/              ← CI/CD pipelines
├── CLAUDE.md                   ← Project overview
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md                   ← This file
```

## 🛠️ Available Commands

```bash
npm run dev           # Start development server (port 3000)
npm run build         # Production build
npm run start         # Run production build  
npm run type-check    # TypeScript validation
npm run lint          # ESLint validation
npm test              # Run test suite
```

## 🎨 Design System

### Colors
- **Neon Accents**: Cyan (#00F0FF), Magenta (#FF00FF), Green (#00FF41)
- **Terminal**: Dark backgrounds with grid pattern
- **Solana**: Purple (#9945FF), Green (#14F195)

### Typography
- **Display**: Space Grotesk (headings)
- **Body**: Inter (readable text)
- **Code**: JetBrains Mono (code snippets)

### Animations
- Glitch effects on hover
- Glow animations for neon elements
- Smooth transitions throughout

## 🎯 Features

### Phase 1: MVP ✅
- [x] Next.js 14 setup with TypeScript
- [x] Tailwind CSS configuration
- [x] Component architecture
- [x] Navigation & routing
- [ ] Landing page design
- [ ] Course catalog page
- [ ] Course detail & lesson pages
- [ ] Code editor integration

### Phase 2: Core Functionality
- [ ] User dashboard
- [ ] Learning progress tracking
- [ ] Code challenge execution
- [ ] Achievement system
- [ ] User profile page
- [ ] Settings & preferences

### Phase 3: Gamification
- [ ] XP point system
- [ ] Leaderboard integration
- [ ] Achievement badges
- [ ] Streak tracking
- [ ] Level progression

### Phase 4: On-Chain Integration (Future)
- [ ] Wallet connection
- [ ] XP token reading (Token-2022)
- [ ] Certificate issuance (ZK Compression)
- [ ] Credential verification
- [ ] On-chain leaderboard

## 🛠️ Tech Stack

| Category | Technology | Version |
| --- | --- | --- |
| Framework | Next.js | 14.2+ |
| UI Library | React | 18.3+ |
| Language | TypeScript | 5.5+ |
| Styling | Tailwind CSS | 3.4+ |
| State (Client) | Zustand | 4.5+ |
| State (Server) | TanStack Query | 5.48+ |
| Code Editor | Monaco Editor | 4.7+ |
| i18n | next-intl | 3.15+ |
| Package Manager | npm | 9+ |

## 📖 Development Guide

### Code Standards

Follow these for all contributions:

- **TypeScript**: Strict mode enabled; no `any` types
- **React**: Functional components with hooks
- **Components**: Keep under 300 lines
- **Styling**: Tailwind CSS + `cn()` utility
- **i18n**: Use `useI18n()` for all user text
- **Testing**: Jest + React Testing Library
- **Commits**: Conventional commit format

See code standards docs:
- [.claude/rules/typescript.md](.claude/rules/typescript.md) - TypeScript best practices
- [.claude/rules/react.md](.claude/rules/react.md) - React component patterns
- [.claude/skills/frontend-development.md](.claude/skills/frontend-development.md) - Detailed guide

### Development Workflow

1. **Create feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make changes** following code standards

3. **Verify & test**
   ```bash
   npm run type-check   # Type validation
   npm run lint         # Code linting
   npm run build        # Production build
   npm test             # Run tests
   ```

4. **Commit & push**
   ```bash
   git commit -m "feat: description of change"
   git push origin feature/your-feature-name
   ```

5. **Open pull request** on GitHub

### CI/CD Pipeline

All commits to `main` and `develop` branches automatically:
- Run TypeScript type checking
- Run ESLint validation
- Execute test suite
- Perform security audit
- Deploy preview to Vercel (for PRs)
- Deploy to production (main branch only)

## 🚀 Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set environment variables in project settings
3. Push to `main` branch for production deployment
4. Push to `develop` branch for staging

### Manual Deployment

```bash
# Build production bundle
npm run build

# Run production server
npm run start
```

## 🤝 Contributing

We welcome contributions! Please:

1. Read [docs/SPECIFICATION.md](docs/SPECIFICATION.md) for requirements
2. Check [CLAUDE.md](CLAUDE.md) for project structure
3. Follow code standards in `.claude/rules/`
4. Write tests for new features
5. Update documentation
6. Open pull request with clear description

## 📝 License

MIT License - See [LICENSE](LICENSE) for details

Copyright © 2026 Superteam Brazil

## 🔗 Links

- **Repository**: https://github.com/solanabr/solana-academy-platform
- **Documentation**: See `/docs` folder
- **Solana Docs**: https://docs.solana.com/
- **Next.js Docs**: https://nextjs.org/docs

## 🙋‍♀️ Support

- **Questions**: Check [docs/](docs/) for documentation
- **Issues**: Open GitHub issue
- **Discord**: Superteam Brazil community

---

**Last Updated**: February 2026  
**Maintained By**: Superteam Academy Team  
**Status**: 🟢 In Active Development

- Clear implementation path
- On-chain integration ready

### Design (20%)
- Distinctive cyberpunk theme ✅
- Custom Tailwind config ✅
- Polished dark mode ✅

### Performance (15%)
- Next.js 14 (optimized) ✅
- Image optimization planned
- Code splitting planned

### Documentation (10%)
- Comprehensive docs ✅
- Clear setup guide ✅
- Architecture explained ✅

## 🚀 Deployment

When ready to deploy:

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel --prod
```

## 📖 Additional Resources

- [Solana Docs](https://docs.solana.com)
- [Next.js Docs](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Wallet Adapter](https://github.com/solana-labs/wallet-adapter)

## 🤝 Contributing

This project is for the Superteam Brazil bounty competition. After completion, contributions will be welcome!

## 📝 License

MIT

---

**Built for Superteam Brazil Academy Bounty - $4,000 USDC Prize**

Good luck! 🎯
