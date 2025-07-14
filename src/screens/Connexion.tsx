import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { MaterialCommunityIcons } from '@expo/vector-icons';

WebBrowser.maybeCompleteAuthSession();

type ConnexionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Connexion'
>;

export default function Connexion() {
  const navigation = useNavigation<ConnexionScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const redirectUri = makeRedirectUri({});

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: '665570993787-p9st3nhjsbhgm8o0ao5vllvm1rplhk14.apps.googleusercontent.com',
    redirectUri: 'https://auth.expo.io/@sahminacera/MonSuiviRando',
    responseType: 'id_token',
  });

  useEffect(() => {
    if (response?.type === 'success' && response.authentication?.idToken) {
      const { idToken } = response.authentication;
      const credential = GoogleAuthProvider.credential(idToken);

      signInWithCredential(auth, credential)
        .then(() => {
          Alert.alert('Connexion Google', 'Connexion réussie avec Google.');
          navigation.replace('Home');
        })
        .catch((error) => {
          console.error(error);
          Alert.alert('Erreur Google', error.message);
        });
    }
  }, [response]);

  const handleConnexion = async () => {
    if (!email || !motDePasse) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs.');
      return;
    }

    try {
      await signInWithEmailAndPassword(auth, email, motDePasse);
      Alert.alert('Succès', 'Connexion réussie');
      navigation.replace('Home');
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
      <Text style={styles.title}>Se connecter 🔐</Text>

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

      <TouchableOpacity style={styles.button} onPress={handleConnexion}>
        <MaterialCommunityIcons name="login" size={20} color="white" style={styles.icon} />
        <Text style={styles.buttonText}>Connexion</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.googleButton]}
        onPress={() => promptAsync()}
        disabled={!request}
      >
        <Image
          source={require('../../assets/logo/google-logo.png')} 
          style={styles.googleLogo}
        />
        <Text style={styles.buttonText}>Se connecter avec Google</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  icon: {
    marginRight: 10,
    color: '#fff',
  },
  googleLogo: {
    width: 20,
    height: 20,
    marginRight: 10,
  },
});
