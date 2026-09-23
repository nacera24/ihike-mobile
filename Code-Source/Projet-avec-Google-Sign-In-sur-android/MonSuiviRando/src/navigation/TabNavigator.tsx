import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import Home from '../screens/Home';
import Historique from '../screens/Historique';
import MesPhotos from '../screens/MesPhotos';
import PlusStack from './PlusStack';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false, tabBarShowLabel: true }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          title: 'Accueil',
          tabBarIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="home" size={size} color={color} />
          ),
        }}
      /> 
      <Tab.Screen
        name="Historique"
        component={Historique}
        options={{
          title: 'Historique',
          tabBarIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MesPhotos"
        component={MesPhotos}
        options={{
          title: 'Mes Photos',
          tabBarIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="image-multiple" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Plus"
        component={PlusStack}
        options={{
          title: 'Plus',
          tabBarIcon: ({ size, color }) => (
            <MaterialCommunityIcons name="dots-horizontal-circle" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
