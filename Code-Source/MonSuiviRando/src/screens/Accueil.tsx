import React from 'react';
import LottieView from 'lottie-react-native';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { FontAwesome, FontAwesome5 } from '@expo/vector-icons';

type AccueilScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Accueil'>;

export default function Accueil() {
  const navigation = useNavigation<AccueilScreenNavigationProp>();

  return (
    <View style={styles.container}>
      {/* Arrière-plan animé */}
      <LottieView
        source={require('../../assets/animations/GPSNavigation.json')}
        autoPlay
        loop
        style={styles.backgroundAnimation}
        resizeMode="cover"
      />

     
      <View style={styles.header}>
        <Image
          source={require('../../assets/logo/ihike-logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      <View style={styles.overlay}>
       
        <View style={styles.titleRow}>
          <Text style={styles.title}>Bienvenue</Text>
          <FontAwesome5 name="hiking" size={36} color="#000" style={styles.titleIcon} />
        </View>

        {/* Bouton Connexion */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Connexion')}
        >
          <View style={styles.iconButton}>
            <FontAwesome name="sign-in" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Connexion</Text>
          </View>
        </TouchableOpacity>

        {/* Bouton Inscription */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Inscription')}
        >
          <View style={styles.iconButton}>
            <FontAwesome name="user-plus" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>Inscription</Text>
          </View>
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
    zIndex: -1,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start', 
    marginBottom: 40,
    marginLeft: 30,
    width: '100%',
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  titleIcon: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    marginVertical: 10,
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
  },
  header: {
    position: 'absolute',
    top: 80, 
    width: '100%',
    alignItems: 'center',
    zIndex: 2,
  },
  logoImage: {
    width: 220,
    height: 120,
  },
});
