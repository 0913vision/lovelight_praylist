export interface PrayerItem {
  id: string;
  content: string;
}

export interface PrayerSubsection {
  id: string;
  name: string;
  items: PrayerItem[];
  isNew?: boolean;
}

export interface PrayerSection {
  id: string;
  name: string;
  items: PrayerItem[];
  subsections?: PrayerSubsection[];
}

export interface PrayerData {
  id?: string;
  title: string;
  date: string;
  sections: PrayerSection[];
  verse?: {
    text: string;
    reference: string;
  };
  created_at?: string;
  updated_at?: string;
}

export interface EditablePrayerData extends Omit<PrayerData, 'sections'> {
  sections: EditablePrayerSection[];
}

export interface EditablePrayerSection {
  id: string;
  name: string;
  items: EditablePrayerItem[];
  subsections: EditablePrayerSubsection[];
  isNew?: boolean;
}

export interface EditablePrayerItem {
  id: string;
  content: string;
  isNew?: boolean;
}

export interface EditablePrayerSubsection {
  id: string;
  name: string;
  items: EditablePrayerItem[];
  isNew?: boolean;
}
