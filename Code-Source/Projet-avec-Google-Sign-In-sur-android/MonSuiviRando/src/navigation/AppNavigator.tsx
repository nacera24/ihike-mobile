import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Accueil from '../screens/Accueil';
import Connexion from '../screens/Connexion';
import Inscription from '../screens/Inscription';
import Suivi from '../screens/Suivi';
import DetailRando from '../screens/DetailRando';
import TabNavigator from './TabNavigator';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Accueil">
        {/* Avant connexion */}
        <Stack.Screen name="Accueil" component={Accueil} options={{ headerShown: false }} />
        <Stack.Screen name="Connexion" component={Connexion} />
        <Stack.Screen name="Inscription" component={Inscription} />
        {/* Après connexion */}
        <Stack.Screen name="MainApp" component={TabNavigator} options={{ headerShown: false }} />
        {/* Écrans hors-onglets */}
        <Stack.Screen name="Suivi" component={Suivi} />
        <Stack.Screen name="DetailRando" component={DetailRando} options={{ title: 'Détails de la randonnée' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
