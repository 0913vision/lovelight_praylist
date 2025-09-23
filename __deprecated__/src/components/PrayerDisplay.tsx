'use client';

interface PrayerSection {
  name: string;
  items: string[];
}

interface PrayerDisplayProps {
  title: string;
  sections: PrayerSection[];
  verse?: {
    text: string;
    reference: string;
  };
}

export default function PrayerDisplay({ title, sections, verse }: PrayerDisplayProps) {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h1>

      {sections.map((section, index) => (
        <div key={index} className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            <span className="font-bold">&lt;</span>{section.name}<span className="font-bold">&gt;</span>
          </h2>
          <ol className="space-y-1 ml-4">
            {section.items.map((item, itemIndex) => (
              <li key={itemIndex} className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {itemIndex + 1}. {item}
              </li>
            ))}
          </ol>
        </div>
      ))}

      {verse && (
        <div className="mt-12 pt-8 border-t border-gray-300/50 dark:border-gray-700">
          <blockquote className="text-gray-600 dark:text-gray-400 italic">
            <p className="mb-2">"{verse.text}"</p>
            <cite className="text-sm not-italic">— {verse.reference}</cite>
          </blockquote>
        </div>
      )}
    </div>
  );
}