// src/navigation/DrawerNavigator.tsx

import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Home from '../screens/Home';
import Profil from '../screens/Profil';
import MesSuivis from '../screens/MesSuivis';
import CustomDrawerContent from './CustomDrawerContent'; // 👈 importe ton drawer personnalisé

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />} 
    >
      <Drawer.Screen name="Home" component={Home} options={{ title: 'Accueil' }} />
      <Drawer.Screen name="Profil" component={Profil} />
      <Drawer.Screen name="MesSuivis" component={MesSuivis} />
    </Drawer.Navigator>
  );
}
