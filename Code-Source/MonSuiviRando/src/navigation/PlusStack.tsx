import React from 'react';
import { Pressable, Text } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import PlusMenu from '../screens/PlusMenu';
import Profil from '../screens/Profil';

const Stack = createNativeStackNavigator();

export default function PlusStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen
        name="PlusMenu"
        component={PlusMenu}
        options={{ title: 'Plus' }}
      />

      <Stack.Screen
        name="Profil"
        component={Profil}
        options={({ navigation }) => ({
          title: 'Mon profil',
          
          headerBackVisible: false,
          // On dessine un propre bouton: flèche + texte "Back"
          headerLeft: () => (
            <Pressable
              onPress={navigation.goBack}
              hitSlop={12}
              style={{
                paddingHorizontal: 6,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <MaterialCommunityIcons
                name="chevron-left"
                size={28}
                color="#007AFF"
              />
              <Text
                style={{
                  color: '#007AFF',
                  fontSize: 17,
                  fontWeight: '600',
                  marginLeft: 2,
                }}
              >
                Back
              </Text>
            </Pressable>
          ),
        })}
      />
    </Stack.Navigator>
  );
}
