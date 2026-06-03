import React, { useState } from 'react';

type Theme = 'light' | 'dark' | 'pink' | 'custom';

interface ThemePickerProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
}

export const ThemePicker: React.FC<ThemePickerProps> = ({ currentTheme, onThemeChange }) => {
  const [customColor, setCustomColor] = useState('#3b82f6'); // Default blå

  const themes = [
    { id: 'light', label: 'Light', color: '#ffffff', textColor: '#000000' },
    { id: 'dark', label: 'Dark', color: '#1f2937', textColor: '#ffffff' },
    { id: 'pink', label: 'Pink', color: '#fce7f3', textColor: '#831843' },
  ];

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Choose Theme</h3>
      
      <div className="grid grid-cols-3 gap-4 mb-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id as Theme)}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentTheme === theme.id 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-400'
            }`}
            style={{ backgroundColor: theme.color, color: theme.textColor }}
          >
            {theme.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <label className="text-gray-700 dark:text-gray-300">Custom Color:</label>
        <input
          type="color"
          value={customColor}
          onChange={(e) => {
            setCustomColor(e.target.value);
            onThemeChange('custom');
          }}
          className="w-10 h-10 rounded cursor-pointer"
        />
        {currentTheme === 'custom' && (
          <span className="text-sm text-gray-500">Selected: {customColor}</span>
        )}
      </div>
    </div>
  );
};
