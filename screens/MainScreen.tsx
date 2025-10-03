import React, { useState, useEffect, useRef } from 'react';
import { View, DeviceEventEmitter } from 'react-native';
import Animated from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../App';
import TopBar from '../components/TopBar';
import PrayerDisplay from '../components/PrayerDisplay';
import PullToRefresh, { PullToRefreshRef } from '../components/PullToRefresh';
import { usePrayers, PrayerData } from '../hooks/usePrayers';

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface MainScreenProps {
  navigation: MainScreenNavigationProp;
}

export default function MainScreen({ navigation }: MainScreenProps) {
  const { fetchLatestPrayer, loadCachedData } = usePrayers();
  const [prayerData, setPrayerData] = useState<PrayerData | null>(null);
  const pullToRefreshRef = useRef<PullToRefreshRef>(null);

  // 초기 데이터 로드 - 캐시 먼저, 그 다음 서버 데이터
  useEffect(() => {
    const initializeData = async () => {
      // 1. 캐시된 데이터 먼저 로드 (즉시 표시)
      const cachedData = await loadCachedData();
      if (cachedData) {
        setPrayerData(cachedData);
      }

      // 2. 약간의 딜레이 후 서버에서 최신 데이터 가져오기
      setTimeout(() => {
        pullToRefreshRef.current?.triggerRefresh();
      }, 100);
    };

    initializeData();
  }, [loadCachedData]);

  // EditScreen에서 저장 성공 시 이벤트 수신하여 PTR 트리거
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('refreshPrayerData', () => {
      setTimeout(() => {
        pullToRefreshRef.current?.triggerRefresh();
      }, 100);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const loadPrayerData = async () => {
    const data = await fetchLatestPrayer();
    if (data) {
      setPrayerData(data);
      Toast.show({
        type: 'success',
        text1: '최신 기도제목을 불러왔습니다',
        position: 'bottom',
        visibilityTime: 2000,
      });
    } else {
      Toast.show({
        type: 'error',
        text1: '기도제목을 불러오는데 실패했습니다',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  };

  const handleRefresh = async () => {
    await loadPrayerData();
  };

  const handleEditPress = () => {
    navigation.navigate('Edit');
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <View style={{ zIndex: 100, elevation: 100 }}>
        <TopBar onEditPress={handleEditPress} />
      </View>
      <PullToRefresh ref={pullToRefreshRef} onRefresh={handleRefresh} threshold={40}>
        <Animated.ScrollView
          contentContainerStyle={{
            paddingTop: 16,
            paddingHorizontal: 24,
            paddingBottom: 32,
          }}
          showsVerticalScrollIndicator={true}
        >
          {prayerData && <PrayerDisplay {...prayerData} />}
        </Animated.ScrollView>
      </PullToRefresh>
    </SafeAreaView>
  );
}