import React, { useState } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { Provider } from 'react-redux';
import { store } from './src/redux/store';
import * as Font from 'expo-font';
import AppLoading from 'expo-app-loading';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LogBox } from 'react-native';

LogBox.ignoreAllLogs(false); // Affiche toutes les erreurs

// ✅ Polyfill sécurisé pour findLast (Android + anciens)
if (!Array.prototype.findLast) {
  Array.prototype.findLast = function<T>(
    this: T[],
    callback: (value: T, index: number, array: T[]) => boolean,
    thisArg?: any
  ): T | undefined {
    for (let i = this.length - 1; i >= 0; i--) {
      if (callback.call(thisArg, this[i], i, this)) return this[i];
    }
    return undefined;
  };
}

// ✅ Chargement des polices (MaterialCommunityIcons)
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
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}
