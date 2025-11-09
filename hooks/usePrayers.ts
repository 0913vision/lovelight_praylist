import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

const CACHE_KEY = 'cached_prayer_data';

export interface PrayerVerse {
  text: string;
  reference: string;
}

export interface PrayerSubsection {
  name: string;
  items: string[];
}

export interface PrayerSection {
  name: string;
  items?: string[];
  subsections?: PrayerSubsection[];
}

export interface PrayerData {
  title: string;
  sections: PrayerSection[];
  verse: PrayerVerse;
}

export interface PrayerRecord {
  id: string;
  title: string;
  content: {
    sections: PrayerSection[];
    verse: PrayerVerse;
  };
  created_at: string;
}

const normalizeItems = (items: unknown): string[] => {
  if (!Array.isArray(items)) return [];
  return items
    .map(item => (typeof item === 'string' ? item : ''))
    .filter(item => item.trim().length > 0);
};

const normalizeSubsections = (subsections: unknown): PrayerSubsection[] => {
  if (!Array.isArray(subsections)) return [];
  return subsections
    .map(subsection => {
      const fallbackName = typeof subsection?.name === 'string' ? subsection.name : '';
      const normalizedItems = normalizeItems(subsection?.items);
      return {
        name: fallbackName,
        items: normalizedItems,
      };
    })
    .filter(subsection => subsection.items.length > 0);
};

const normalizeSections = (sections: unknown): PrayerSection[] => {
  if (!Array.isArray(sections)) return [];
  return sections.map(section => {
    const normalizedSection: PrayerSection = {
      name: typeof section?.name === 'string' ? section.name : '',
    };

    const normalizedItems = normalizeItems(section?.items);
    if (normalizedItems.length > 0) {
      normalizedSection.items = normalizedItems;
    }

    const normalizedSubsections = normalizeSubsections(section?.subsections);
    if (normalizedSubsections.length > 0) {
      normalizedSection.subsections = normalizedSubsections;
    }

    return normalizedSection;
  });
};

export function usePrayers() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 캐시에서 데이터 가져오기
  const loadCachedData = useCallback(async (): Promise<PrayerData | null> => {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const parsed = JSON.parse(cached);
      return {
        title: parsed?.title ?? '',
        sections: normalizeSections(parsed?.sections),
        verse: parsed?.verse ?? { text: '', reference: '' },
      };
    } catch (err) {
      console.error('Error loading cached data:', err);
      return null;
    }
  }, [normalizeSections]);

  // 캐시에 데이터 저장
  const saveCachedData = useCallback(async (data: PrayerData): Promise<void> => {
    try {
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Error saving cached data:', err);
    }
  }, []);

  // 최신 기도제목 가져오기
  const fetchLatestPrayer = useCallback(async (): Promise<PrayerData | null> => {
    try {
      setLoading(true);
      setError(null);

      // Timeout 설정 (10초)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('요청 시간이 초과되었습니다')), 10000);
      });

      const fetchPromise = supabase
        .from('prayers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      const { data, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise,
      ]) as any;

      if (fetchError) {
        throw fetchError;
      }

      if (!data) {
        return null;
      }

      const prayerData: PrayerData = {
        title: data.title,
        sections: normalizeSections(data.content?.sections),
        verse: data.content?.verse ?? { text: '', reference: '' },
      };

      // 데이터를 캐시에 저장
      await saveCachedData(prayerData);

      return prayerData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기도제목을 불러오는데 실패했습니다';
      setError(errorMessage);
      console.error('Error fetching prayer:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [saveCachedData]);

  // 새 기도제목 업로드
  const uploadPrayer = useCallback(async (prayerData: PrayerData): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const { error: uploadError } = await supabase
        .from('prayers')
        .insert({
          title: prayerData.title,
          content: {
            sections: prayerData.sections,
            verse: prayerData.verse,
          },
        });

      if (uploadError) {
        throw uploadError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '기도제목을 업로드하는데 실패했습니다';
      setError(errorMessage);
      console.error('Error uploading prayer:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    fetchLatestPrayer,
    uploadPrayer,
    loadCachedData,
  };
}
