import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type AccueilScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function Home() {
  const navigation = useNavigation<AccueilScreenNavigationProp>();
  const [nom, setNom] = useState('');

    useEffect(() => {
    const fetchNomUtilisateur = async () => {
      const auth = getAuth(); // Récupère l’instance Firebase Auth
      const user = auth.currentUser; // Utilisateur actuellement connecté

      if (user) {
        const docRef = doc(db, 'utilisateurs', user.uid); // Référence au document Firestore
        const docSnap = await getDoc(docRef); // Récupère le document

        if (docSnap.exists()) {
          const data = docSnap.data(); // Récupère les données
          setNom(data.nom || ''); // Stocke le nom dans l’état
        }
      }
    };

    fetchNomUtilisateur(); // Appelle la fonction au démarrage
  }, []);

  return (
  <View style={styles.container}>
    <LottieView
      source={require('../../assets/animations/walking.json')}
      autoPlay
      loop
      style={styles.backgroundAnimation}
      resizeMode="cover"
    />

    <View style={styles.top}>
      <Text style={styles.bienvenue} numberOfLines={1} ellipsizeMode="tail"> Bienvenue, {nom} 👋</Text>
    </View>

    <View style={styles.bottom}>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Suivi')}>
          <Text style={styles.buttonText}>Démarrer un suivi</Text>
      </TouchableOpacity>

    </View>
  </View>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  top: {
    marginTop: 30,
  },
  bienvenue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  backgroundAnimation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  bottom: {
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
