// Helper function to detect language from text
export const detectLanguageFromText = (text: string): string | null => {
  // Simple language detection based on keywords and syntax
  const lowerCaseText = text.toLowerCase();
  
  // Check for specific language indicators
  if (lowerCaseText.includes('def ') && lowerCaseText.includes(':') || 
      lowerCaseText.includes('import ') && lowerCaseText.includes('print(')) {
    return 'python';
  } else if (lowerCaseText.includes('func ') && lowerCaseText.includes('package ')) {
    return 'go';
  } else if (lowerCaseText.includes('public class ') || lowerCaseText.includes('public static void main')) {
    return 'java';
  } else if (lowerCaseText.includes('console.log') || lowerCaseText.includes('function') || 
              lowerCaseText.includes('const ') || lowerCaseText.includes('let ') ||
              lowerCaseText.includes('var ')) {
    return 'javascript';
  } else if (lowerCaseText.includes('interface ') || lowerCaseText.includes(': string') || 
              lowerCaseText.includes(': number') || lowerCaseText.includes('<T>')) {
    return 'typescript';
  } else if (lowerCaseText.includes('#include') || lowerCaseText.includes('int main()')) {
    return 'c++';
  } else if (lowerCaseText.includes('namespace ') || lowerCaseText.includes('using System;')) {
    return 'c#';
  } else if (lowerCaseText.includes('fn ') && lowerCaseText.includes('->')) {
    return 'rust';
  } else if (lowerCaseText.includes('fun ') && lowerCaseText.includes('val ')) {
    return 'kotlin';
  } else if (lowerCaseText.includes('func ') && lowerCaseText.includes('import Foundation')) {
    return 'swift';
  } else if (lowerCaseText.includes('<?php') || lowerCaseText.includes('echo ')) {
    return 'php';
  } else if (lowerCaseText.includes('def ') && lowerCaseText.includes('end')) {
    return 'ruby';
  }
  
  // Default to null if no language is detected
  return null;
}; 