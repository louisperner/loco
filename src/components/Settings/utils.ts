import { LocoSettings } from './types';
import { RgbaColor } from 'react-colorful';

// Constants for localStorage keys
export const SETTINGS_STORAGE_KEY = 'loco-settings';

/**
 * Saves settings to localStorage
 * @param settings The settings object to save
 */
export const saveSettings = (settings: LocoSettings): void => {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
};

/**
 * Loads settings from localStorage
 * @returns The settings object or null if not found
 */
export const loadSettings = (): LocoSettings | null => {
  try {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return savedSettings ? JSON.parse(savedSettings) : null;
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
};

/**
 * Parses a color string to RGBA object
 * Supports rgba, rgb, hex, and named colors
 * @param color The color string to parse
 * @returns An RgbaColor object
 */
export const parseColor = (color?: string): RgbaColor => {
  // Default color if input is undefined
  if (!color) {
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  
  // Check for rgba format
  const rgbaMatch = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)/);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
      a: rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1
    };
  }
  
  // Check for hex format
  const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
      a: 1
    };
  }
  
  // Short hex format
  const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
  if (shortHexMatch) {
    return {
      r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
      g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
      b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
      a: 1
    };
  }
  
  // For other formats or invalid values, return a default color
  return { r: 0, g: 0, b: 0, a: 1 };
};

/**
 * Converts an RgbaColor object to a CSS rgba string
 * @param color The RgbaColor object
 * @returns A CSS rgba string
 */
export const rgbaToString = (color: RgbaColor): string => {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`;
}; 