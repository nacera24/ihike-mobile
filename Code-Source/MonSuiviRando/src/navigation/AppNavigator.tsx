import React from 'react';
import { Pressable, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

        {/* Après connexion : on cache le header du parent pour laisser les headers des Tabs */}
        <Stack.Screen name="MainApp" component={TabNavigator} options={{ headerShown: false }} />

        {/* Écrans hors-onglets */}
        <Stack.Screen
          name="Suivi"
          component={Suivi}
          options={({ navigation }) => ({
            title: 'Suivi',
            headerBackVisible: false, 
            headerLeft: () => (
              <Pressable
                onPress={navigation.goBack}
                hitSlop={12}
                style={{ paddingHorizontal: 6, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}
              >
                <MaterialCommunityIcons name="chevron-left" size={28} color="#007AFF" />
                <Text style={{ color: '#007AFF', fontSize: 17, fontWeight: '600', marginLeft: 2 }}>Back</Text>
              </Pressable>
            ),
          })}
        />

        <Stack.Screen
          name="DetailRando"
          component={DetailRando}
          options={{ title: 'Détails de la randonnée' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
