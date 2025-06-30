import React from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import flowTheme from './flowTheme';

type FlowThemeProviderProps = {
  children: React.ReactNode;
};

/**
 * FlowThemeProvider applies the consistent Flow visual theme across the application
 * Preserves dark theme with orange accents from the original Flow framework
 */
export const FlowThemeProvider: React.FC<FlowThemeProviderProps> = ({ children }) => {
  return (
    <ThemeProvider theme={flowTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};

export default FlowThemeProvider;
