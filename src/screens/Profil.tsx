import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export default function Profil() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const chargerInfos = async () => {
      const user = getAuth().currentUser;
      if (user) {
        const ref = doc(db, 'utilisateurs', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const data = snap.data();
          setNom(data.nom || '');
          setPrenom(data.prenom || '');
          setAge(data.age || '');
          setEmail(data.email || '');
        }
      }
    };
    chargerInfos();
  }, []);

  const handleModifier = async () => {
    const user = getAuth().currentUser;
    if (user) {
      try {
        const ref = doc(db, 'utilisateurs', user.uid);
        await updateDoc(ref, {
          nom,
          prenom,
          age,
        });
        Alert.alert('Succès', 'Profil mis à jour');
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      }

    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Nom</Text>
      <TextInput value={nom} onChangeText={setNom} style={styles.input} />

      <Text style={styles.label}>Prénom</Text>
      <TextInput value={prenom} onChangeText={setPrenom} style={styles.input} />

      <Text style={styles.label}>Âge</Text>
      <TextInput value={age} onChangeText={setAge} keyboardType="numeric" style={styles.input} />

      <Text style={styles.label}>Adresse e-mail</Text>
      <TextInput value={email} editable={false} style={[styles.input, { backgroundColor: '#eee' }]} />

      <TouchableOpacity style={styles.button} onPress={handleModifier}>
        <Text style={styles.buttonText}>Enregistrer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { marginTop: 10, fontWeight: 'bold' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
  },
  button: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
