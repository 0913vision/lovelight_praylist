import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as KakaoLogin from '@react-native-seoul/kakao-login';

const USER_SESSION_KEY = 'kakao_user_session';

export interface KakaoUser {
  id: string;
  nickname?: string;
  email?: string;
}

export interface UserSession {
  kakaoUser: KakaoUser;
  isAuthor: boolean;
  isAllowedUser: boolean;
  loginTimestamp: number;
}

interface AuthContextType {
  user: KakaoUser | null;
  loading: boolean;
  isAuthor: boolean;
  isAllowedUser: boolean | null;
  signInWithKakao: () => Promise<{ data: KakaoUser | null; error: Error | null }>;
  signOut: () => Promise<void>;
  forceSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<KakaoUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isAllowedUser, setIsAllowedUser] = useState<boolean | null>(null);

  // 세션 저장
  const saveSession = async (session: UserSession) => {
    try {
      await AsyncStorage.setItem(USER_SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('세션 저장 실패:', error);
    }
  };

  // 세션 로드
  const loadSession = async (): Promise<UserSession | null> => {
    try {
      const sessionData = await AsyncStorage.getItem(USER_SESSION_KEY);
      return sessionData ? JSON.parse(sessionData) : null;
    } catch (error) {
      console.error('세션 로드 실패:', error);
      return null;
    }
  };

  // 세션 삭제
  const clearSession = async () => {
    try {
      await AsyncStorage.removeItem(USER_SESSION_KEY);
    } catch (error) {
      console.error('세션 삭제 실패:', error);
    }
  };

  // denied_users에 사용자 등록 (없을 때만)
  const recordDeniedUser = async (kakaoUser: KakaoUser) => {
    try {
      // denied_users에 이미 있는지 확인
      const { data: existingUser } = await supabase
        .from('denied_users')
        .select('kakao_id')
        .eq('kakao_id', kakaoUser.id)
        .single();

      // 없을 때만 추가
      if (!existingUser) {
        await supabase
          .from('denied_users')
          .insert({
            kakao_id: kakaoUser.id,
            nickname: kakaoUser.nickname,
            email: kakaoUser.email,
          });
      }
    } catch (error) {
      // 에러는 조용히 무시 (이미 존재하거나 네트워크 오류)
    }
  };

  // Supabase에서 사용자 권한 확인
  const checkUserPermission = async (kakaoUser: KakaoUser) => {
    try {
      const { data, error } = await supabase
        .from('allowed_users')
        .select('is_author')
        .eq('kakao_id', kakaoUser.id)
        .single();

      if (error) {
        // allowed_users에 없으면 denied_users에 기록
        await recordDeniedUser(kakaoUser);
        return { isAllowed: false, isAuthor: false };
      }

      return {
        isAllowed: true,
        isAuthor: data?.is_author || false,
      };
    } catch (error) {
      console.error('권한 확인 중 오류:', error);
      return { isAllowed: false, isAuthor: false };
    }
  };

  // 사용자 로그인 처리 (권한 확인 + 상태 업데이트 + 세션 저장)
  const processUserLogin = async (kakaoUser: KakaoUser) => {
    console.log('카카오 ID:', kakaoUser.id);
    console.log('닉네임:', kakaoUser.nickname);
    console.log('이메일:', kakaoUser.email);

    // 권한 확인
    const { isAllowed, isAuthor: authorStatus } = await checkUserPermission(kakaoUser);

    console.log('권한:', { isAllowed, isAuthor: authorStatus });

    // 세션 저장
    const session: UserSession = {
      kakaoUser,
      isAuthor: authorStatus,
      isAllowedUser: isAllowed,
      loginTimestamp: Date.now(),
    };
    await saveSession(session);

    // 상태 업데이트
    setUser(kakaoUser);
    setIsAllowedUser(isAllowed);
    setIsAuthor(authorStatus);

    return { isAllowed, isAuthor: authorStatus };
  };

  // 초기화: 저장된 세션 확인 (자동 로그인)
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);

        const session = await loadSession();

        if (session) {
          console.log('=== 자동 로그인 ===');
          // 공통 로그인 처리 로직 사용
          await processUserLogin(session.kakaoUser);
          console.log('==================');
        }
      } catch (error) {
        console.error('인증 초기화 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // 카카오 로그인
  const signInWithKakao = async () => {
    try {
      setLoading(true);

      if (Platform.OS === 'web') {
        setLoading(false);
        return {
          data: null,
          error: new Error('웹 플랫폼에서는 카카오 로그인을 지원하지 않습니다'),
        };
      }

      const result = await KakaoLogin.login();

      if (!result) {
        setLoading(false);
        return {
          data: null,
          error: new Error('카카오 로그인 실패'),
        };
      }

      const profile = await KakaoLogin.getProfile();

      const kakaoUser: KakaoUser = {
        id: String(profile.id),
        nickname: profile.nickname,
        email: profile.email,
      };

      // 공통 로그인 처리 로직 사용
      await processUserLogin(kakaoUser);
      setLoading(false);

      return { data: kakaoUser, error: null };
    } catch (error: any) {
      setLoading(false);
      return { data: null, error };
    }
  };

  // 로그아웃
  const signOut = async () => {
    try {
      if (Platform.OS !== 'web') {
        await KakaoLogin.logout();
      }
      await clearSession();
      setUser(null);
      setIsAuthor(false);
      setIsAllowedUser(null);
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  };

  const forceSignOut = async () => {
    await signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthor,
        isAllowedUser,
        signInWithKakao,
        signOut,
        forceSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
