import React, { useState } from 'react';
import { useAppStore } from '../../store/appStore';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = async () => {
    await updateSettings(localSettings);
    onClose();
    
    // Show success notification
    if ((window as any).showNotification) {
      (window as any).showNotification({
        type: 'success',
        title: 'Settings saved',
        message: 'Your preferences have been updated',
      });
    }
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Settings
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          <div className="space-y-6">
            {/* Theme Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={localSettings.theme}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                className="input"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>

            {/* Font Size Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Font Size
              </label>
              <input
                type="range"
                min="12"
                max="20"
                value={localSettings.fontSize}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
                className="w-full"
              />
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {localSettings.fontSize}px
              </div>
            </div>

            {/* Auto Connect Setting */}
            <div className="flex items-center">
              <input
                id="auto-connect"
                type="checkbox"
                checked={localSettings.autoConnect}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, autoConnect: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="auto-connect" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Auto-connect to last server
              </label>
            </div>

            {/* Default Timeout Setting */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Default Timeout (ms)
              </label>
              <input
                type="number"
                value={localSettings.defaultTimeout}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, defaultTimeout: parseInt(e.target.value) || 30000 }))}
                className="input w-32"
                min="1000"
                max="300000"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={handleCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="btn btn-primary"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel; 