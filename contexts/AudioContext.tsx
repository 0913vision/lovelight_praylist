import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { AppState, AppStateStatus, Platform } from 'react-native';

interface AudioContextType {
  isPlaying: boolean;
  play: () => Promise<void>;
  pause: () => Promise<void>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);


export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const player = useAudioPlayer(require('../assets/audio/background-music.mp3'), {
    loop: true,
  });
  const playerStatus = useAudioPlayerStatus(player);
  const [isPlaying, setIsPlaying] = useState(false);

  const appState = useRef(AppState.currentState);
  const fadeInterval = useRef<NodeJS.Timeout | null>(null);
  const isFading = useRef(false);



  // Initialize audio
  useEffect(() => {
    const initAudio = async () => {
      try {

        if (Platform.OS !== 'web') {
          await setAudioModeAsync({
            playsInSilentMode: true,
            shouldPlayInBackground: false, // 백그라운드 재생 비활성화
            interruptionMode: 'mixWithOthers',
          });
        }

        // 모바일에서만 자동 재생
        if (Platform.OS !== 'web') {
          setIsPlaying(true);
          player.volume = 0;
          player.play();
          fadeIn(1.0);
        } else {
          setIsPlaying(false);
        }

      } catch (error) {
        console.log('Failed to initialize audio:', error);
      }
    };

    initAudio();

    return () => {
      if (fadeInterval.current) {
        clearInterval(fadeInterval.current);
      }
    };
  }, []);


  // App state handling
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [player]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {


    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {

      // 오디오 세션 재활성화
      if (Platform.OS !== 'web') {
        await setIsAudioActiveAsync(true);
      }
    } else if (nextAppState.match(/inactive|background/)) {

      // 오디오 세션을 수동으로 관리하여 currentTime 보존
      if (Platform.OS !== 'web') {
        await setIsAudioActiveAsync(false);
      }


      if (isPlaying) {
        fadeOut(() => {
          player.pause();
        });
        setIsPlaying(false);
      }
    }

    appState.current = nextAppState;
  };

  const fadeIn = async (targetVolume: number) => {
    if (fadeInterval.current) {
      clearInterval(fadeInterval.current);
    }

    isFading.current = true;
    let currentVol = 0;
    player.volume = 0;

    fadeInterval.current = setInterval(() => {
      if (!isFading.current) {
        clearInterval(fadeInterval.current!);
        fadeInterval.current = null;
        return;
      }

      currentVol += targetVolume / 20; // 20 steps fade-in
      if (currentVol >= targetVolume) {
        currentVol = targetVolume;
        clearInterval(fadeInterval.current!);
        fadeInterval.current = null;
        isFading.current = false;
      }
      player.volume = currentVol;
    }, 50); // 50ms intervals = 1 second fade-in
  };

  const fadeOut = async (callback?: () => void) => {
    if (fadeInterval.current) {
      clearInterval(fadeInterval.current);
    }

    let currentVol = player.volume || 1.0;

    fadeInterval.current = setInterval(() => {
      currentVol -= 1.0 / 20; // 20 steps fade-out
      if (currentVol <= 0) {
        currentVol = 0;
        clearInterval(fadeInterval.current!);
        fadeInterval.current = null;
        callback?.();
      }
      player.volume = currentVol;
    }, 50); // 50ms intervals = 1 second fade-out
  };

  const play = async () => {
    try {
      setIsPlaying(true);
      player.volume = 0;
      player.play();
      fadeIn(1.0);
    } catch (error) {
      console.log('Failed to play:', error);
    }
  };

  const pause = async () => {
    try {
      setIsPlaying(false);
      fadeOut(() => {
        player.pause();
      });
    } catch (error) {
      console.log('Failed to pause:', error);
    }
  };

  const contextValue: AudioContextType = {
    isPlaying,
    play,
    pause,
  };

  return (
    <AudioContext.Provider value={contextValue}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = (): AudioContextType => {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};