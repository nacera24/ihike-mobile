import React from 'react';
import LottieView from 'lottie-react-native';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type AccueilScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Accueil'>;

export default function Accueil() {
  const navigation = useNavigation<AccueilScreenNavigationProp>();

  return (
    <View style={styles.container}>
      {/* Arrière-plan animé */}
      <LottieView
             source={require('../../assets/animations/walking.json')}
             autoPlay
             loop
             style={styles.backgroundAnimation}
             resizeMode="cover"
        />
     <View style={styles.header}>
      <Text style={styles.logoText}>RANDOMAP </Text>
    </View>
 
      <View style={styles.overlay}>

        <Text style={styles.title}>Bienvenue 🥾</Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Connexion')}
        >
          <Text style={styles.buttonText}>🔐 Connexion</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Inscription')}
        >
          <Text style={styles.buttonText}>📝 Inscription</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
 backgroundAnimation: {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1, // Derrière les autres éléments
},
  overlay: {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  paddingHorizontal: 20,
  backgroundColor: 'rgba(255, 255, 255, 0.5)', 
},

title: {
  fontSize: 36,
  fontWeight: 'bold',
  marginBottom: 40,
  color: '#000',
},
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
  position: 'absolute',
  top: 60, 
  width: '100%',
  alignItems: 'center',
  zIndex: 2,
},

logoText: {
  fontSize: 32,
  fontWeight: 'bold',
  color: '#007AFF',
  letterSpacing: 2,
  textTransform: 'uppercase',
},
});

