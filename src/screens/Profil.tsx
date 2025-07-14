import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable,
  Platform,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function Profil() {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
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
          setEmail(data.email || '');
          if (data.dateNaissance) {
            setDateNaissance(new Date(data.dateNaissance));
          }
        }
      }
    };
    chargerInfos();
  }, []);

  const handleModifier = async () => {
    const user = getAuth().currentUser;
    if (user && dateNaissance) {
      try {
        const ref = doc(db, 'utilisateurs', user.uid);
        await updateDoc(ref, {
          nom,
          prenom,
          dateNaissance: dateNaissance.toISOString().split('T')[0],
        });
        Alert.alert('Succès', 'Profil mis à jour');
      } catch (error: any) {
        Alert.alert('Erreur', error.message);
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Titre avec icône */}
      <View style={styles.titleRow}>
        <MaterialCommunityIcons name="account-circle" size={28} color="#007AFF" style={styles.titleIcon} />
        <Text style={styles.title}>Mon profil</Text>
      </View>

      <Text style={styles.label}>Nom</Text>
      <TextInput value={nom} onChangeText={setNom} style={styles.input} />

      <Text style={styles.label}>Prénom</Text>
      <TextInput value={prenom} onChangeText={setPrenom} style={styles.input} />

      <Text style={styles.label}>Date de naissance</Text>
      <Pressable style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
        <Text style={{ color: dateNaissance ? '#000' : '#999', flex: 1 }}>
          {dateNaissance
            ? format(dateNaissance, 'dd MMMM yyyy', { locale: fr })
            : 'Choisir une date'}
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

      <Text style={styles.label}>Adresse e-mail</Text>
      <TextInput value={email} editable={false} style={[styles.input, { backgroundColor: '#eee' }]} />

      {/* Bouton enregistrer avec icône */}
      <TouchableOpacity style={styles.button} onPress={handleModifier}>
        <View style={styles.iconButton}>
          <MaterialCommunityIcons name="content-save" size={20} color="#fff" style={styles.icon} />
          <Text style={styles.buttonText}>Enregistrer</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20 },
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
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#007AFF',
  },
  label: {
    marginTop: 10,
    fontWeight: 'bold',
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 5,
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
    marginTop: 5,
    backgroundColor: '#fff',
  },
  inlinePicker: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    marginTop: 10,
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
  iconButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  button: {
    marginTop: 30,
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
