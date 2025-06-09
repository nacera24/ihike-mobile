
import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import Home from '../screens/Home';
import Profil from '../screens/Profil';
import MesSuivis from '../screens/MesSuivis';
import MesPhotos from '../screens/MesPhotos';
import CustomDrawerContent from './CustomDrawerContent';

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />} 
    >
      <Drawer.Screen name="Home" component={Home} options={{ title: 'Accueil' }} />
      <Drawer.Screen name="Profil" component={Profil} options={{ title: 'Mon profil' }} />
      <Drawer.Screen name="MesSuivis" component={MesSuivis} options={{ title: 'Mes suivis' }} />
      <Drawer.Screen name="MesPhotos" component={MesPhotos} options={{ title: 'Mes photos' }} />
    </Drawer.Navigator>
  );
}
