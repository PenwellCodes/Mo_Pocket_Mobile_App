import React from "react";
import { AuthProvider } from "../appstate/AuthContext";
import { CustomThemeProvider } from "../appstate/CustomThemeProvider"; // Ensure correct import
import { LanguageProvider } from './LanguageContext';

const GlobalContextProvider = ({ children }) => {
  return (
    <CustomThemeProvider>
      <LanguageProvider>
        <AuthProvider>
              {children}
        </AuthProvider>
      </LanguageProvider>
    </CustomThemeProvider>
  );
};

export default GlobalContextProvider;
