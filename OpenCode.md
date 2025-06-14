# OpenCode.md

## Build/Test/Lint Commands

**Frontend (React + Vite)**
- Install: `cd frontend && npm install`
- Build: `npm run build`
- Lint: `npm run lint`
- Dev: `npm run dev`
- Single test: _(No test script found in frontend by default)_

**Mobile (React Native)**
- Install: `cd 10-date-mobile && npm install`
- Build (Android/iOS): `npm run android` / `npm run ios`
- Lint: `npm run lint`
- Test all: `npm test`
- Test single file: `npx jest path/to/File.test.tsx` or `npm test -- path/to/File.test.tsx`

**Backend/NestJS**
- Install: `cd backend-app && npm install`
- Build: `npm run build`
- Lint: `npm run lint`
- Test all: `npm test`
- Test single: `npx jest path/to/file.spec.ts` or `npm test -- path/to/file.spec.ts`

## Code Style Guidelines

- **Imports:** Use absolute imports via path aliases (`@components/`, etc.) as configured in tsconfig.
- **Formatting:** Use Prettier for formatting (`npm run format`). Prefer single quotes and trailing commas where possible.
- **Types:** TypeScript strict mode is enabled (`noImplicitAny`, `strictNullChecks`). Prefer interfaces and explicit types.
- **Naming:** Use camelCase for variables/functions, PascalCase for types/classes, kebab-case for file names.
- **Error Handling:** Use try/catch for async. Prefer custom error types where appropriate. Never silence errors.
- **React:** Use function components and hooks. `eslint-plugin-react-hooks` is enforced. Only export constant components.
- **Testing:** Use Jest for all test suites (`.test.ts(x)`/`.spec.ts`).
- **Lint:** ESLint extends `recommended` and TypeScript-specific rules. In backend, avoid `any` and floating promises.
- **Pull Requests:** Follow clear, descriptive branch names (`feature/`, `fix/`). Update docs/tests as needed.
- **General:** Maintain inclusive, respectful communication (see CODE_OF_CONDUCT.md).
