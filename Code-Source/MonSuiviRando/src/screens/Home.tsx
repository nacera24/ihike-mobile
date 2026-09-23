import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore'; 
import { db } from '../firebase/firebaseConfig';
import LottieView from 'lottie-react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { setNom } from '../redux/userSlice';
import { MaterialCommunityIcons } from '@expo/vector-icons';

type AccueilScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function Home() {
  const navigation = useNavigation<AccueilScreenNavigationProp>();
  const dispatch = useDispatch();
  const nom = useSelector((state: RootState) => state.user.nom);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return;

    
    const ref = doc(db, 'utilisateurs', user.uid);
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as { nom?: string } | undefined;
      dispatch(setNom(data?.nom || ''));
    });

    return () => unsub();
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/animations/Traveler.json')}
        autoPlay
        loop
        style={styles.backgroundAnimation}
        resizeMode="cover"
      />

      <View style={styles.top}>
        <Text style={styles.bienvenue} numberOfLines={1} ellipsizeMode="tail">
          Bienvenue, {nom} 👋
        </Text>
      </View>

      <View style={styles.bottom}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Suivi')}>
          <MaterialCommunityIcons name="walk" size={22} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Démarrer un suivi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'space-between', paddingVertical: 50, paddingHorizontal: 30, alignItems: 'center' },
  top: { marginTop: 30 },
  bienvenue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  backgroundAnimation: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1 },
  bottom: { marginBottom: 30 },
  button: { backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 20, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  icon: { marginRight: 10 },
  buttonText: { color: 'white', fontSize: 16 },
});
