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
  Pressable,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../firebase/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

type InscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Inscription'>;

export default function Inscription() {
  const navigation = useNavigation<InscriptionScreenNavigationProp>();
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [genre, setGenre] = useState<'Homme' | 'Femme' | ''>('');
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');

  const handleInscription = async () => {
    if (!nom || !prenom || !dateNaissance || !genre || !email || !motDePasse) {
      Alert.alert('Erreur', 'Tous les champs sont requis.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, motDePasse);
      const user = userCredential.user;

      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: nom });
      }

      await setDoc(doc(db, 'utilisateurs', user.uid), {
        nom,
        prenom,
        dateNaissance: dateNaissance.toISOString().split('T')[0],
        genre,
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
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Titre  */}
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="account-plus" size={28} color="#007AFF" style={styles.titleIcon} />
          <Text style={styles.title}>Créer un compte</Text>
        </View>

        <TextInput placeholder="Nom" style={styles.input} value={nom} onChangeText={setNom} />
        <TextInput placeholder="Prénom" style={styles.input} value={prenom} onChangeText={setPrenom} />

        <Pressable style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: dateNaissance ? '#000' : '#999', flex: 1 }}>
            {dateNaissance
              ? format(dateNaissance, 'dd MMMM yyyy', { locale: fr })
              : 'Date de naissance'}
          </Text>
          <MaterialCommunityIcons name="calendar" size={24} color="#007AFF" />
        </Pressable>

        {showDatePicker && (
          <View style={styles.inlinePicker}>
            <DateTimePicker
              value={dateNaissance || new Date(2000, 0, 1)}
              mode="date"
              display="spinner"
              onChange={(event, selectedDate) => {
                if (selectedDate) setDateNaissance(selectedDate);
              }}
              maximumDate={new Date()}
              locale="fr-FR"
              style={{ width: '100%', height: 150 }}
            />
            <TouchableOpacity
              style={styles.validateButton}
              onPress={() => setShowDatePicker(false)}
            >
              <Text style={styles.validateText}>Valider</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Genre :</Text>

        <View style={styles.genreContainer}>
          <TouchableOpacity
            style={[styles.genreButton, genre === 'Femme' && styles.selected, { flex: 1, marginRight: 5 }]}
            onPress={() => setGenre('Femme')}
          >
            <Text style={[styles.genreText, genre === 'Femme' && styles.selectedText]}>
              👩 Femme
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genreButton, genre === 'Homme' && styles.selected, { flex: 1, marginLeft: 5 }]}
            onPress={() => setGenre('Homme')}
          >
            <Text style={[styles.genreText, genre === 'Homme' && styles.selectedText]}>
              👨 Homme
            </Text>
          </TouchableOpacity>
        </View>

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

        {/* Bouton S'inscrire  */}
        <TouchableOpacity style={styles.button} onPress={handleInscription}>
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="check-circle" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>S'inscrire</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 30,
    backgroundColor: '#e6f0ff',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  titleIcon: {
    marginRight: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
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
  datePicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  inlinePicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
  },
  validateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  validateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  genreContainer: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  genreButton: {
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
  },
  selected: {
    backgroundColor: '#007AFF',
  },
  genreText: {
    color: '#000',
    fontSize: 16,
    textAlign: 'center',
  },
  selectedText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
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
