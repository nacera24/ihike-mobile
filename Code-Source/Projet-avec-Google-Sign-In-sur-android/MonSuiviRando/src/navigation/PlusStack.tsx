import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PlusMenu from '../screens/PlusMenu';
import Profil from '../screens/Profil';

const Stack = createNativeStackNavigator();

export default function PlusStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="PlusMenu" component={PlusMenu} options={{ title: 'Plus' }} />
      <Stack.Screen name="Profil" component={Profil} options={{ title: 'Mon profil' }} />
    </Stack.Navigator>
  );
}
