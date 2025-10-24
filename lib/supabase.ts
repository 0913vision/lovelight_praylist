import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'

// 환경변수에서 Supabase URL과 공개 키를 가져옵니다
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

// 데이터베이스 전용으로 사용 (인증은 Kakao SDK로 처리)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
})