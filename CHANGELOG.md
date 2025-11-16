# Changelog

All notable changes to the Aptum Web project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added - 2025-11-16
- **Google Drive Sync**: Complete integration with Google Drive API v3
  - Automatic data synchronization across devices
  - Cloud backup for user data (profile, plans, settings, API keys)
  - Uses secure `appDataFolder` scope for privacy
- **Returning Customer Login Flow**
  - Welcome page now detects existing users via Google Drive
  - Automatic data restoration for returning users
  - Skip onboarding flow when data exists
  - Navigate directly to Weekly Overview page
- **New Welcome Page UI**
  - "Sign in with Google" button for authenticated experience
  - "Continue without sign-in" button for offline usage
  - Loading states during data check and restoration
  - Error handling with user-friendly messages
- **Automatic Sync Triggers**
  - Sync after profile save/update
  - Sync after interview completion
  - Sync after plan generation
  - Sync after API key changes

### Changed - 2025-11-16
- **Breaking**: `byok.set()` is now async (was synchronous)
  - Updated all call sites: `Settings.tsx`, `Connect.tsx`, `Onboarding.tsx`
  - Required to support Drive sync operations
- **Welcome Page**: Removed "Begin" button, replaced with sign-in options
- **Navigation Flow**: Returning users bypass onboarding

### Fixed - 2025-11-16
- Fixed React Hook `useEffect` dependencies warning in `Welcome.tsx`
- Updated e2e tests to match new Welcome page UI
- Fixed 2 test failures related to Welcome page button changes

### Technical Details - 2025-11-16
**Files Modified:**
- `src/services/driveSync.ts` - Complete rewrite with actual API integration
- `src/services/byok.ts` - Made `set()` async for Drive sync
- `src/services/coach.ts` - Added sync trigger after plan generation
- `src/services/interview.ts` - Added sync trigger after interview save
- `src/pages/onboarding/Welcome.tsx` - New UI and returning user logic
- `src/pages/Settings.tsx` - Updated for async `byok.set()`
- `src/pages/onboarding/Connect.tsx` - Updated for async `byok.set()`
- `src/pages/Onboarding.tsx` - Updated for async `byok.set()`
- `e2e/01-app-loads.spec.ts` - Updated for new Welcome UI
- `e2e/02-welcome-navigation.spec.ts` - Updated for new Welcome UI

**New Dependencies:**
- None (uses existing Google Identity Services)

**API Changes:**
- `driveSync.hasExistingData(): Promise<boolean>` - Check for existing user data
- `driveSync.uploadAllData(): Promise<void>` - Upload all app data to Drive
- `driveSync.downloadAndRestoreData(): Promise<boolean>` - Restore data from Drive
- `byok.set(cfg: Partial<ByokConfig>): Promise<void>` - Now returns Promise

### Test Results - 2025-11-16
- ✅ 29 tests passing
- ⚠️ 2 tests failing (pre-existing, unrelated to Drive sync)
  - `e2e/10-goals-page.spec.ts` - Goals page UI tests
  - These need separate attention
- 📝 6 tests skipped

---

## Previous Work (Before 2025-11-16)

The following features were already implemented:

### Core Features
- ✅ User onboarding flow (Profile → Connect → Goals → Plan)
- ✅ Google OAuth authentication
- ✅ OpenAI API integration for plan generation
- ✅ Profile management (age, height, weight, experience levels)
- ✅ Goals interview system
- ✅ Training plan generation
- ✅ Plan visualization and editing
- ✅ Settings page
- ✅ IndexedDB for local data persistence
- ✅ Responsive UI with TailwindCSS

### Technical Stack
- React + TypeScript
- Vite (build tool)
- TailwindCSS (styling)
- Zustand (state management)
- IndexedDB (local storage)
- Playwright (e2e testing)
- Google Identity Services (authentication)
- OpenAI API (AI features)

---

## Known Issues

### Active Issues
1. **Goals Page Tests Failing** (2 tests)
   - "Plan Recommendation" panel not found
   - "AI" ownership badges not found
   - Likely UI/test mismatch that needs investigation

### Resolved Issues
- ✅ Welcome page test failures (fixed 2025-11-16)
- ✅ React Hook dependencies warning (fixed 2025-11-16)

---

## Future Roadmap

### Planned Features
1. **Weekly Overview Page** - Full implementation with schedule display
2. **Daily Workout View** - Detailed daily training interface
3. **Progress Tracking** - Track workouts and improvements
4. **Exercise Library** - Database of exercises with instructions
5. **Workout History** - View past workouts and performance
6. **Nutrition Planning** - Meal planning and tracking
7. **Recovery Tracking** - Sleep, stress, HRV monitoring

### Infrastructure
- Offline support with service workers
- Better error handling and retry logic
- Performance optimizations
- Comprehensive test coverage
- CI/CD pipeline
- Production deployment setup

---

**Note**: This changelog will be updated with each significant change to the project.
