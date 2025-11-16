# Aptum Web - Development Status

**Last Updated:** 2025-11-16

## 🚀 Current State

The Aptum web application is a fitness training coach that helps users create personalized training plans. The app uses OpenAI's API for intelligent plan generation and Google Drive for data synchronization.

### ✅ Recently Completed Features

#### Google Drive Sync & Returning Customer Login (2025-11-16)
- **Full Google Drive API v3 integration** implemented in `src/services/driveSync.ts`
- **Automatic data sync** after user actions (profile save, interview save, plan generation, API key updates)
- **Returning user detection**: Welcome page now detects existing data on Google Drive
- **Automatic data restoration**: Returning users skip onboarding and go directly to `/week` page
- **New Welcome page UI**: 
  - "Sign in with Google" button for authenticated sync
  - "Continue without sign-in" button for offline usage

**Technical Implementation:**
- Uses Google Drive `appDataFolder` scope for secure, isolated storage
- Single JSON file (`aptum-data.json`) stores all app data
- Multipart/related upload for efficient file operations
- Made `byok.set()` async to support Drive sync
- Updated all call sites: `Settings.tsx`, `Connect.tsx`, `Onboarding.tsx`
- Sync triggers in: `coach.ts`, `interview.ts`, `byok.ts`

## 📁 Project Structure

### Key Directories
```
src/
├── pages/              # React route pages
│   ├── onboarding/     # Onboarding flow pages
│   │   ├── Welcome.tsx      # Entry point with Google sign-in
│   │   ├── Profile.tsx      # User profile setup
│   │   ├── Connect.tsx      # API key setup
│   │   └── Goals.tsx        # Training goals configuration
│   ├── Weekly.tsx      # Weekly overview (placeholder for returning users)
│   ├── Strategy.tsx    # Training strategy page
│   ├── Mesocycle.tsx   # Mesocycle planning
│   └── Settings.tsx    # App settings
├── services/           # Business logic
│   ├── auth.ts         # Google OAuth authentication
│   ├── driveSync.ts    # Google Drive sync (RECENTLY IMPLEMENTED)
│   ├── coach.ts        # Training plan generation
│   ├── interview.ts    # Goals interview logic
│   ├── byok.ts         # API key management (now async)
│   └── storage.ts      # IndexedDB wrapper
├── stores/             # Zustand state management
│   └── auth.ts         # Authentication state
└── components/         # Reusable UI components
```

## 🔑 Environment Setup

### Required Environment Variables
Create a `.env.local` file:
```bash
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Google Cloud Console Setup
1. Create OAuth 2.0 credentials
2. Add authorized JavaScript origins:
   - `http://localhost:5173`
   - Your deployment URL
3. Add authorized redirect URIs (same as origins)
4. Enable Google Drive API
5. Request the following scopes:
   - `https://www.googleapis.com/auth/drive.appdata`
   - `openid`
   - `email`
   - `profile`

## 🧪 Testing

### Run Tests
```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# E2E tests (Playwright)
npm run test:e2e

# E2E tests with UI
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

### Current Test Status
- ✅ **29 tests passing**
- ⚠️ **2 tests failing** (pre-existing, unrelated to recent changes)
  - `e2e/10-goals-page.spec.ts`: "Plan Recommendation" panel tests
  - These test features that haven't been fully implemented yet
- 📝 **6 tests skipped**

### Recent Test Updates
- Updated Welcome page tests to match new sign-in UI
- Fixed navigation flow tests for "Continue without sign-in" button

## 🏗️ Development Workflow

### Start Development Server
```bash
npm run dev
# Server runs on http://localhost:5173
```

### Code Quality
All changes should:
1. ✅ Pass TypeScript type checking (`npm run typecheck`)
2. ✅ Pass ESLint (`npm run lint`)
3. ✅ Not break existing e2e tests
4. ✅ Be committed with clear commit messages

### Git Workflow
```bash
# Check status
git status

# Add changes
git add .

# Commit with descriptive message
git commit -m "feat: description of feature"

# Push to main
git push origin main
```

## 📊 User Flow

### New User Flow
1. Land on `/onboarding/welcome`
2. Click "Continue without sign-in" OR "Sign in with Google"
3. Complete profile setup at `/onboarding/profile`
4. Set up OpenAI API key at `/onboarding/connect`
5. Configure training goals at `/onboarding/goals`
6. Generate training plan
7. View plan and proceed to training

### Returning User Flow (NEW)
1. Land on `/onboarding/welcome`
2. Click "Sign in with Google"
3. App checks Google Drive for existing data
4. If data found:
   - Automatically restore profile, settings, plan, API keys
   - Navigate directly to `/week` (Weekly Overview)
5. If no data found:
   - Proceed with normal onboarding flow

## 🔄 Data Synchronization

### Synced Data
The following data is automatically synced to Google Drive:
- ✅ User profile
- ✅ Goals interview state
- ✅ App settings
- ✅ Training plan
- ✅ OpenAI API key
- ✅ Last sync timestamp

### Sync Triggers
Data is synced after:
- Profile save/update
- Interview completion
- Training plan generation
- API key changes

### Local Storage
- **IndexedDB**: Used for profile, conversation, settings, plan data
- **localStorage**: Used for API keys (via `byok.ts`)
- **Google Drive**: Cloud backup and cross-device sync

## 🐛 Known Issues

### Test Failures (Pre-existing)
1. **Goals page "Plan Recommendation" tests**: UI doesn't match test expectations
   - Likely needs UI updates or test adjustments
   - Not blocking current functionality

### Pending Features
- Weekly Overview page (`/week`) is a placeholder - needs full implementation
- Some Goals page features may need refinement based on test expectations

## 🎯 Next Steps / Potential Improvements

### High Priority
1. **Implement Weekly Overview page** (`src/pages/Weekly.tsx`)
   - Display week-by-week training schedule
   - Allow quick adjustments before daily execution
   - Show progress tracking

2. **Fix/Update Goals Page Tests**
   - Align UI with test expectations OR
   - Update tests to match current UI implementation

3. **Error Handling Enhancement**
   - Better error messages for Drive sync failures
   - Retry logic for network issues
   - User-friendly error notifications

### Medium Priority
4. **Offline Support**
   - Service worker for offline functionality
   - Queue sync operations when offline
   - Sync when connection restored

5. **Data Export/Import**
   - Manual export to JSON
   - Import from backup files
   - Privacy: allow users to download their data

6. **Testing**
   - Add unit tests for Drive sync logic
   - Integration tests for sync triggers
   - Test coverage for error scenarios

### Low Priority
7. **Performance Optimization**
   - Debounce sync operations
   - Batch multiple changes
   - Compression for large data

8. **UI Polish**
   - Loading states for sync operations
   - Success/error toast notifications
   - Sync status indicator in header

## 📝 Code Conventions

### File Naming
- React components: PascalCase (`Welcome.tsx`, `PlanField.tsx`)
- Services/utilities: camelCase (`driveSync.ts`, `coach.ts`)
- Types/interfaces: PascalCase with descriptive names

### Code Style
- Use TypeScript for type safety
- Prefer async/await over promises
- Use try-catch for error handling
- Comment complex logic, but prefer self-documenting code
- Keep functions focused and small

### State Management
- Use Zustand stores for global state (`auth`, future: `sync`)
- Use React hooks (useState, useEffect) for local state
- Use IndexedDB for persistent data via `storage.ts` wrapper

## 🔐 Security Notes

### API Keys
- User's OpenAI API keys are stored locally (localStorage)
- Keys are synced to Google Drive's `appDataFolder` (private, app-only access)
- Never send API keys to any backend server
- Users bring their own API key (BYOK model)

### Google Drive Access
- Uses `appDataFolder` scope - app can only access its own files
- Users cannot see `aptum-data.json` in their Drive UI
- Data is deleted if user revokes app access
- OAuth tokens managed by Google Identity Services library

## 📚 Additional Resources

### Documentation
- [Google Drive API v3](https://developers.google.com/drive/api/v3/about-sdk)
- [Google Identity Services](https://developers.google.com/identity/gsi/web/guides/overview)
- [Playwright Testing](https://playwright.dev/)
- [Zustand State Management](https://github.com/pmndrs/zustand)

### Key Dependencies
- **React** + **TypeScript**: UI framework
- **Vite**: Build tool and dev server
- **TailwindCSS**: Utility-first CSS
- **Zustand**: State management
- **idb**: IndexedDB wrapper
- **Playwright**: E2E testing
- **OpenAI API**: AI-powered plan generation

---

## 💡 Tips for New Contributors

1. **Read the code**: Start with `src/pages/onboarding/Welcome.tsx` to understand the flow
2. **Check the tests**: E2E tests in `e2e/` show expected behavior
3. **Run locally**: `npm run dev` and test the full user journey
4. **Ask questions**: If unclear, check git history for context
5. **Test thoroughly**: Run `npm run test:e2e` before pushing

---

**For questions or issues, check git history or review recent commits for context.**
