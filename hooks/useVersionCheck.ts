import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '../lib/supabase';

interface AppConfig {
  platform: string;
  min_version: string;
  min_version_code: number;
}

export function useVersionCheck() {
  const [isUpdateRequired, setIsUpdateRequired] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [currentVersion, setCurrentVersion] = useState<string>('1.0.0');
  const [currentVersionCode, setCurrentVersionCode] = useState<number>(1);
  const [minVersion, setMinVersion] = useState<string>('1.0.0');
  const [minVersionCode, setMinVersionCode] = useState<number>(1);

  useEffect(() => {
    checkVersion();
  }, []);

  const checkVersion = async () => {
    try {
      setIsChecking(true);

      // 현재 앱의 버전 정보 가져오기
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      const versionCode = Platform.OS === 'android'
        ? Constants.expoConfig?.android?.versionCode || 1
        : Constants.expoConfig?.ios?.buildNumber || '1';

      const currentCode = typeof versionCode === 'string'
        ? parseInt(versionCode, 10)
        : versionCode;

      setCurrentVersion(appVersion);
      setCurrentVersionCode(currentCode);

      // Supabase에서 최소 요구 버전 가져오기
      const { data, error } = await supabase
        .from('app_config')
        .select('min_version, min_version_code')
        .eq('platform', Platform.OS)
        .single();

      if (error) {
        console.error('Error fetching app config:', error);
        // 에러 발생 시 업데이트 불필요로 처리 (앱 실행 가능)
        setIsUpdateRequired(false);
        return;
      }

      if (data) {
        setMinVersion(data.min_version);
        setMinVersionCode(data.min_version_code);

        // 현재 버전 코드가 최소 요구 버전 코드보다 낮으면 업데이트 필요
        if (true || currentCode < data.min_version_code) {
          setIsUpdateRequired(true);
        } else {
          setIsUpdateRequired(false);
        }
      }
    } catch (err) {
      console.error('Version check error:', err);
      // 에러 발생 시 업데이트 불필요로 처리 (앱 실행 가능)
      setIsUpdateRequired(false);
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isUpdateRequired,
    isChecking,
    currentVersion,
    minVersion,
    currentVersionCode,
    minVersionCode,
  };
}
