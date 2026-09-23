// App.tsx
import React, { useState } from 'react';
import { Provider } from 'react-redux';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

import AppNavigator from './src/navigation/AppNavigator';
import { store } from './src/redux/store';

// Charge les polices (icônes MaterialCommunity)
const loadFonts = () => {
  return Font.loadAsync({
    ...MaterialCommunityIcons.font,
  });
};

export default function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  if (!fontsLoaded) {
    return (
      <AppLoading
        startAsync={loadFonts}
        onFinish={() => setFontsLoaded(true)}
        onError={console.warn}
      />
    );
  }

  return (
    // Fournit les insets de safe-area à toute l’app 
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <Provider store={store}>
        <AppNavigator />
      </Provider>
    </SafeAreaProvider>
  );
}
