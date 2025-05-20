import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig'; 


type InscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Inscription'>;

export default function Inscription() {
  const navigation = useNavigation<InscriptionScreenNavigationProp>();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [age, setAge] = useState('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

 const handleInscription = async () => {
  if (!nom || !prenom || !age || !email || !motDePasse) {
    Alert.alert('Erreur', 'Tous les champs sont requis.');
    return;
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, motDePasse);
    const user = userCredential.user;

    // Mettre à jour le nom affiché dans Firebase Auth
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, { displayName: nom });
    }

    // Ajouter les données utilisateur dans Firestore
    await setDoc(doc(db, 'utilisateurs', user.uid), {
      nom,
      prenom,
      age,
      email,
    });

    Alert.alert('Succès', 'Compte créé avec succès !');
    navigation.navigate('Connexion');
  } catch (error: any) {
    console.error(error);
    Alert.alert('Erreur', error.message);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.title}>Créer un compte 📝</Text>

      <TextInput
        placeholder="Nom"
        style={styles.input}
        value={nom}
        onChangeText={setNom}
      />

      <TextInput
       placeholder="Prénom"
       style={styles.input}
       value={prenom}
       onChangeText={setPrenom}
      />

      <TextInput
       placeholder="Âge"
       style={styles.input}
       value={age}
       onChangeText={setAge}
       keyboardType="numeric"
      />

      <TextInput
        placeholder="Adresse e-mail"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Mot de passe"
        style={styles.input}
        value={motDePasse}
        onChangeText={setMotDePasse}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleInscription}>
        <Text style={styles.buttonText}>S'inscrire</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
    backgroundColor: '#f0f8ff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#007AFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
