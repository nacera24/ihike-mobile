import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Accueil from '../screens/Accueil';
import Connexion from '../screens/Connexion';
import Inscription from '../screens/Inscription';
import DrawerNavigator from './DrawerNavigator';
import Suivi from '../screens/Suivi';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Accueil">
        <Stack.Screen name="Accueil" component={Accueil} options={{ headerShown: false }} />
        <Stack.Screen name="Connexion" component={Connexion} /> 
        <Stack.Screen name="Inscription" component={Inscription} /> 
       {/* Pages accessibles après connexion */}
        <Stack.Screen
          name="Home"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Suivi" component={Suivi} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

