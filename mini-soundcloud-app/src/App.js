import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { PlayerProvider } from './contexts/PlayerContext';
import { TearoomProvider } from './contexts/TearoomContext';
import AppNavigator from './navigation/AppNavigator';
import { View, StyleSheet } from 'react-native';

const AppContent = () => {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        <AppNavigator />
      </View>
    </>
  );
};

const App = () => {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <PlayerProvider>
              <TearoomProvider>
                <AppContent />
              </TearoomProvider>
            </PlayerProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
