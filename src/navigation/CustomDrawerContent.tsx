import React from 'react';
import { DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Alert } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CustomDrawerContent(props: any) {
  const navigation = useNavigation<NavigationProp>();

  const handleDeconnexion = async () => {
    try {
      await signOut(getAuth());
      Alert.alert('Déconnecté', 'Vous avez été déconnecté.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'Connexion' }],
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Erreur lors de la déconnexion.");
    }
  };

  return (
    <DrawerContentScrollView {...props}>
      <DrawerItemList {...props} />
      <DrawerItem
        label="Déconnexion"
        onPress={handleDeconnexion}
        labelStyle={{ color: 'red' }}
      />
    </DrawerContentScrollView>
  );
}
