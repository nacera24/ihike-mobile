import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, signOut } from 'firebase/auth';
import { useNavigation } from '@react-navigation/native';

export default function PlusMenu() {
  const navigation = useNavigation<any>();

  const allerProfil = () => navigation.navigate('Profil');

  const seDeconnecter = async () => {
    try {
      await signOut(getAuth());
      Alert.alert('Déconnecté', 'Vous avez été déconnecté.');
      navigation.reset({ index: 0, routes: [{ name: 'Connexion' }] });
    } catch {
      Alert.alert('Erreur', 'Impossible de se déconnecter.');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.item} onPress={allerProfil}>
        <MaterialCommunityIcons name="account-circle" size={24} />
        <Text style={styles.text}>Profil</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.item, styles.danger]} onPress={seDeconnecter}>
        <MaterialCommunityIcons name="logout" size={24} />
        <Text style={[styles.text, styles.dangerText]}>Déconnexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, gap: 14 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 10, backgroundColor: '#fff' },
  text: { fontSize: 16, fontWeight: '600' },
  danger: { backgroundColor: '#ffeaea' },
  dangerText: { color: '#b00020' },
});
