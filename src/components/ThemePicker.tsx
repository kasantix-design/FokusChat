import React, { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'pink' | 'custom';

interface ThemePickerProps {
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  customColor?: string; // Tillegg
  onCustomColorChange?: (color: string) => void; // Tillegg
}

export const ThemePicker: React.FC<ThemePickerProps> = ({ 
  currentTheme, 
  onThemeChange,
  customColor = '#3b82f6',
  onCustomColorChange
}) => {
  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);

  const themes = [
    { id: 'light', label: 'Lys', color: '#ffffff', textColor: '#000000' },
    { id: 'dark', label: 'Mørk', color: '#1f2937', textColor: '#ffffff' },
    { id: 'pink', label: 'Rosa', color: '#fce7f3', textColor: '#831843' },
    { id: 'custom', label: 'Egen', color: customColor, textColor: '#000000' },
  ];

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">Velg Tema</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {themes.map((theme) => (
          <button
            key={theme.id}
            onClick={() => {
              onThemeChange(theme.id as Theme);
              if (theme.id === 'custom') setIsCustomPickerOpen(true);
            }}
            className={`p-3 rounded-lg border-2 transition-all ${
              currentTheme === theme.id 
                ? 'border-blue-500 ring-2 ring-blue-200' 
                : 'border-gray-200 hover:border-gray-400 dark:border-gray-600'
            }`}
            style={{ backgroundColor: theme.color, color: theme.textColor }}
          >
            {theme.label}
          </button>
        ))}
      </div>

      {/* Custom Color Picker */}
      {(currentTheme === 'custom' || isCustomPickerOpen) && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Velg Din Farge:
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={customColor}
              onChange={(e) => {
                onCustomColorChange?.(e.target.value);
              }}
              className="w-14 h-14 rounded cursor-pointer border-2 border-gray-300"
            />
            <div className="flex-1">
              <div 
                className="h-10 rounded border border-gray-300"
                style={{ backgroundColor: customColor }}
              />
              <p className="text-xs text-gray-500 mt-1">Valgt: {customColor}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
