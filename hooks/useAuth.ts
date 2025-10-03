import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { makeRedirectUri } from 'expo-auth-session';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthor, setIsAuthor] = useState(false);
  const [isAllowedUser, setIsAllowedUser] = useState<boolean | null>(null);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setIsAllowedUser(null); // 확인 중
        const { data } = await supabase
          .from('allowed_users')
          .select('is_author')
          .eq('email', session.user.email)
          .single();

        if (data) {
          setIsAllowedUser(true);
          setIsAuthor(data.is_author || false);
        } else {
          setIsAllowedUser(false);
        }
      }

      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAllowedUser(null);
          setIsAuthor(false);
        }
      }
    );

    const handleDeepLink = async (url: string) => {
      if (url.includes('access_token=')) {
        await WebBrowser.dismissBrowser();
        const params = new URLSearchParams(url.split('#')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (accessToken && refreshToken) {
          const { data } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (data.session?.user) {
            setUser(data.session.user);
            setIsAllowedUser(null); // 확인 중

            const authData = await supabase
              .from('allowed_users')
              .select('is_author')
              .eq('email', data.session.user.email)
              .single();

            if (authData.data) {
              setIsAllowedUser(true);
              setIsAuthor(authData.data.is_author || false);
            } else {
              setIsAllowedUser(false);
              setIsAuthor(false);
            }

            setLoading(false);
          }
        }
      } else {
        await WebBrowser.dismissBrowser();
      }
    };

    const linkingSubscription = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      subscription.unsubscribe();
      linkingSubscription.remove();
    };
  }, []);

  const signInWithKakao = async () => {
    try {
      if (Platform.OS === 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'kakao',
          options: {
            queryParams: {
              scope: 'profile_nickname account_email'
            }
          }
        });
        return { data, error };
      } else {
        const redirectTo = makeRedirectUri();
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: 'kakao',
          options: {
            redirectTo,
            skipBrowserRedirect: true,
            queryParams: {
              scope: 'profile_nickname account_email'
            }
          }
        });

        if (error) {
          return { data: null, error };
        }

        if (data?.url) {
          await WebBrowser.openBrowserAsync(data.url);
        }

        return { data, error };
      }
    } catch (error: any) {
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  };

  const forceSignOut = async () => {
    // TODO(0913vision): 카카오 로그아웃 시 앱이 웹 모드로 전환되는 문제 해결 필요
    // 현재는 Supabase만 로그아웃 처리
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.auth.signOut({ scope: 'global' });

      if (session?.user?.app_metadata?.provider === 'kakao' && Platform.OS !== 'web') {
        const restApiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
        if (restApiKey) {
          const logoutRedirectUri = 'https://your-project-id.supabase.co/auth/v1/callback';
          const logoutUrl = `https://kauth.kakao.com/oauth/logout?client_id=${restApiKey}&logout_redirect_uri=${encodeURIComponent(logoutRedirectUri)}`;
          await WebBrowser.openBrowserAsync(logoutUrl);
        }
      }
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
    }
  };

  return {
    user,
    loading,
    isAuthor,
    isAllowedUser,
    signInWithKakao,
    signOut,
    forceSignOut,
  };
};