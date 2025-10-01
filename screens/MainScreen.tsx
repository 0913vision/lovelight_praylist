import React from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import TopBar from '../components/TopBar';
import PrayerDisplay from '../components/PrayerDisplay';

type RootStackParamList = {
  Main: undefined;
  Edit: undefined;
};

type MainScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface MainScreenProps {
  navigation: MainScreenNavigationProp;
}

export default function MainScreen({ navigation }: MainScreenProps) {
  const prayerData = {
    title: "2024년 교회 기도제목",
    sections: [
      {
        name: "목회진",
        items: [
          "담임목사님의 건강과 지혜",
          "부목사님들의 사역과 성장",
          "전도사님들의 헌신과 열정"
        ]
      },
      {
        name: "교회 부흥",
        items: [
          "새신자들의 지속적인 정착",
          "성도들의 영적 성장",
          "말씀에 대한 갈급함",
          "기도하는 교회"
        ]
      },
      {
        name: "선교",
        items: [
          "해외 선교사님들의 건강과 안전",
          "현지 사역의 열매",
          "선교지 개척과 교회 설립",
          "재정적 필요 공급"
        ]
      },
      {
        name: "청년부",
        items: [
          "청년들의 신앙 회복",
          "세상의 유혹을 이기는 힘",
          "진로와 취업에 대한 인도",
          "다음 세대 리더십 양성"
        ]
      }
    ],
    verse: {
      text: "너희가 내 이름으로 무엇을 구하든지 내가 행하리니 이는 아버지로 하여금 아들로 말미암아 영광을 받으시게 하려 함이라",
      reference: "요한복음 14:13"
    }
  };

  const handleEditPress = () => {
    navigation.navigate('Edit');
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-neutral-900">
      <TopBar onEditPress={handleEditPress} />
      <ScrollView
        contentContainerStyle={{
          paddingTop: 16,
          paddingHorizontal: 24,
          paddingBottom: 32,
        }}
      >
        <PrayerDisplay {...prayerData} />
      </ScrollView>
    </SafeAreaView>
  );
}