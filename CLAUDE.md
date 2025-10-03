# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
React Native (Expo) mobile application for displaying prayer topics with background music. Features role-based editing permissions, dark/light theme support, and plans for App Store/Play Store deployment.

## Tech Stack
- **React Native (Expo SDK 54)** - Cross-platform mobile development
- **TypeScript** - Type safety
- **NativeWind v4** - Tailwind CSS for React Native styling
- **Supabase** - Database and authentication
- **Expo Audio** - Background music playback system
- **React Navigation** - Stack navigation

## Development Commands

### Running the App
```bash
npm start              # Start Expo dev server
npm run android        # Run on Android device/emulator
npm run ios           # Run on iOS device/simulator
npm run web           # Run in web browser
```

### Environment Variables
Required in `.env`:
- `EXPO_PUBLIC_SUPABASE_URL` - Supabase project URL
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `EXPO_PUBLIC_KAKAO_REST_API_KEY` - Kakao API key (optional)

## Architecture

### Core Architecture Patterns

**Context-Based State Management:**
- `AudioContext` - Global audio playback state with fade in/out transitions
- `FontSizeContext` - User-adjustable font size (stored in AsyncStorage)
- Custom hooks (`usePrayers`, `useAuth`, `useTheme`) for data fetching and state

**Navigation Structure:**
- Stack Navigator with Main and Edit screens
- Edit screen presented as modal
- No authentication screen in navigation (direct database access)

**Data Flow:**
- Initial load: AsyncStorage cache → Display → Supabase fetch → Update
- Refresh: Pull-to-refresh triggers Supabase fetch → Update cache
- Edit: DeviceEventEmitter broadcasts 'refreshPrayerData' → Triggers PTR

### Prayer Data Structure
```typescript
interface PrayerData {
  title: string;
  sections: PrayerSection[];  // Array of {name: string, items: string[]}
  verse: PrayerVerse;         // {text: string, reference: string}
}
```

Stored in Supabase `prayers` table as JSONB in `content` field.

### Audio System Architecture
- **Platform-specific behavior**: Auto-plays on mobile, manual on web
- **Lifecycle management**: Pauses when app goes to background, resumes on foreground
- **Fade transitions**: 1-second fade-in/fade-out for smooth audio changes
- **AppState integration**: Handles iOS/Android app state changes via `AppState.addEventListener`

### Theme System
- NativeWind's `useColorScheme()` hook for dark/light mode
- StatusBar adapts to theme: light style for dark mode, dark style for light mode
- All screens use `bg-white dark:bg-neutral-900` pattern

## Key Implementation Details

### Pull-to-Refresh Pattern
Custom `PullToRefresh` component wraps ScrollView with imperative handle:
- `triggerRefresh()` - Programmatically trigger refresh from parent
- Used for: Initial load, post-edit auto-refresh
- DeviceEventEmitter connects EditScreen saves to MainScreen refreshes

### Font Size System
Percentage-based scaling (100% = base size):
- Base text: 16px → scales with `fontSize / 100`
- Title: 24px → scales with `fontSize / 100`
- Verse: 14px → scales with `fontSize / 100`
- ±10% increments, persisted to AsyncStorage

### Safe Area Handling
- `SafeAreaProvider` wraps entire app
- `SafeAreaView` in screens ensures content respects device notches/insets
- TopBar is absolutely positioned with proper safe area margins

### Toast Notifications
- react-native-toast-message with custom config in App.tsx
- Success: Black transparent background
- Error: Red transparent background
- Position: Bottom, 2-3 second visibility

## Common Development Tasks

### Adding a New Screen
1. Create screen in `/screens` directory
2. Add to `RootStackParamList` type in App.tsx
3. Register with `Stack.Screen` in App.tsx navigator
4. Import and use navigation: `navigation.navigate('ScreenName')`

### Modifying Prayer Data Structure
1. Update TypeScript interfaces in `hooks/usePrayers.ts`
2. Update Supabase table schema if needed
3. Update `PrayerDisplay` component rendering logic
4. Update `EditScreen` form fields

### Working with Audio
- Audio file location: `/assets/audio/background-music.mp3`
- Access via `useAudio()` hook: `{ isPlaying, play, pause }`
- Platform check: `Platform.OS !== 'web'` for mobile-specific behavior
- Avoid direct player manipulation; use context methods

### Styling Guidelines
- Use NativeWind classes: `className="text-base dark:text-white"`
- Responsive font sizes via FontSizeContext, not hardcoded
- Dark mode: Always provide `dark:` variants for colors
- Avoid inline styles unless absolutely necessary for dynamic values

## Database Schema (Supabase)

### prayers table
- `id` (UUID, PK)
- `title` (TEXT)
- `content` (JSONB) - Contains `{sections: [], verse: {}}`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### user_roles table (planned)
- `id` (UUID, PK)
- `user_id` (UUID, FK to auth.users)
- `role` (TEXT: 'admin' | 'editor' | 'viewer')
- `created_at` (TIMESTAMP)

Row Level Security (RLS):
- All users can read prayers
- Only admin/editor roles can write (not yet implemented)

## Important Notes

### Platform Differences
- **iOS**: Requires `playsInSilentMode: true` for audio during silent mode
- **Android**: Requires `edgeToEdgeEnabled: true` for full-screen layout
- **Web**: Audio requires user interaction, no auto-play

### Performance Considerations
- AsyncStorage caching prevents loading delays on app start
- 10-second timeout on Supabase requests prevents indefinite loading
- Fade transitions use 50ms intervals (avoid blocking UI)

### Known Limitations
- No authentication flow yet (database is open for reads)
- No role-based permissions implemented
- Background music stops when app is backgrounded (intentional)
- Edit screen has no validation or error handling for malformed data

## Future Development Plans
1. Implement authentication screen with Supabase Auth
2. Add role-based permissions (admin/editor/viewer)
3. Build and submit to App Store / Play Store
4. Add push notifications for new prayer topics
5. Offline support with SQLite caching
