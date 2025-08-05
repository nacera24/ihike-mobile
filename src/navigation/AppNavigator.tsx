import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Accueil from '../screens/Accueil';
import Connexion from '../screens/Connexion';
import Inscription from '../screens/Inscription';
import DrawerNavigator from './DrawerNavigator';
import Suivi from '../screens/Suivi';
import DetailRando from '../screens/DetailRando';  // ✅ AJOUT

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
        <Stack.Screen
          name="MainApp"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Suivi" component={Suivi} />
        {/*écran pour voir une randonnée en détail */}
        <Stack.Screen 
          name="DetailRando" 
          component={DetailRando} 
          options={{ title: "Détails de la randonnée" }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
