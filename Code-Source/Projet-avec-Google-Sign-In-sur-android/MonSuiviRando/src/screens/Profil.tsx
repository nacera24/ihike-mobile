import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Pressable,
  Platform,
  ToastAndroid,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { format as formatDateFns } from 'date-fns';
import { fr } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// imports Redux
import { useDispatch } from 'react-redux';
import { setNom } from '../redux/userSlice';

export default function Profil() {
  const insets = useSafeAreaInsets();

  //  hook Redux
  const dispatch = useDispatch();

  const [nom, setNomLocal] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const [initial, setInitial] = useState<{
    nom: string;
    prenom: string;
    dateNaissance: string | null; // yyyy-MM-dd ou null
  }>({ nom: '', prenom: '', dateNaissance: null });


  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    } else {
      setToastMsg(msg);
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  // La date 
  const parseYmd = (s: string): Date | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (!m) return null;
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    return new Date(y, mo - 1, d);
  };

  const formatYmdSafe = (d: Date | null | undefined): string | null =>
    d ? formatDateFns(d, 'yyyy-MM-dd') : null;

  useEffect(() => {
    const chargerInfos = async () => {
      const user = getAuth().currentUser;
      if (!user) return;

      const ref = doc(db, 'utilisateurs', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as any;

        const nomV = data.nom || '';
        const prenomV = data.prenom || '';
        const emailV = data.email || '';

        let dateObj: Date | null = null;
        let dateYmd: string | null = null;

        if (data.dateNaissance) {
          if (typeof data.dateNaissance === 'string') {
            dateObj = parseYmd(data.dateNaissance);
            dateYmd = data.dateNaissance;
          } else if (data.dateNaissance?.toDate) {
            const d: Date = data.dateNaissance.toDate();
            dateObj = d;
            dateYmd = formatYmdSafe(d);
          } else {
            const d = new Date(data.dateNaissance);
            dateObj = isNaN(d.getTime()) ? null : d;
            dateYmd = formatYmdSafe(dateObj);
          }
        }

        setNomLocal(nomV);
        setPrenom(prenomV);
        setEmail(emailV);
        setDateNaissance(dateObj);
        setInitial({ nom: nomV, prenom: prenomV, dateNaissance: dateYmd });
      }
    };
    chargerInfos();
  }, []);

  const dateAffichee = useMemo(() => {
    return dateNaissance
      ? formatDateFns(dateNaissance, 'dd MMMM yyyy', { locale: fr })
      : 'Choisir une date';
  }, [dateNaissance]);

  const currentYmd = formatYmdSafe(dateNaissance);
  const isDirty =
    nom.trim() !== initial.nom ||
    prenom.trim() !== initial.prenom ||
    currentYmd !== initial.dateNaissance;

  const isValid = !!nom.trim() && !!prenom.trim() && !!dateNaissance;

  const handleModifier = async () => {
    const user = getAuth().currentUser;
    if (!user) return;

    if (!isValid) {
      Alert.alert('Champs requis', 'Nom, prénom et date de naissance sont obligatoires.');
      return;
    }

    try {
      setSaving(true);
      const ymd = formatYmdSafe(dateNaissance)!;
      const ref = doc(db, 'utilisateurs', user.uid);
      await updateDoc(ref, {
        nom: nom.trim(),
        prenom: prenom.trim(),
        dateNaissance: ymd, // yyyy-MM-dd
      });

      //  mise à jour immédiate du Redux store (Home se met à jour instantanément)
      dispatch(setNom(nom.trim()));

      setInitial({ nom: nom.trim(), prenom: prenom.trim(), dateNaissance: ymd });
      showToast('Profil mis à jour');
    } catch (error: any) {
      Alert.alert('Erreur', error?.message ?? 'Mise à jour impossible');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.titleRow}>
          <MaterialCommunityIcons name="account-circle" size={28} color="#007AFF" style={styles.titleIcon} />
          <Text style={styles.title}>Mon profil</Text>
        </View>

        <Text style={styles.label}>Nom</Text>
        <TextInput value={nom} onChangeText={setNomLocal} style={styles.input} placeholder="Votre nom" autoCapitalize="words" />

        <Text style={styles.label}>Prénom</Text>
        <TextInput value={prenom} onChangeText={setPrenom} style={styles.input} placeholder="Votre prénom" autoCapitalize="words" />

        <Text style={styles.label}>Date de naissance</Text>
        <Pressable style={styles.datePicker} onPress={() => setShowDatePicker(true)}>
          <Text style={{ color: dateNaissance ? '#000' : '#999', flex: 1 }}>{dateAffichee}</Text>
          <MaterialCommunityIcons name="calendar" size={24} color="#007AFF" />
        </Pressable>

        {showDatePicker && (
          <View style={styles.inlinePicker}>
            <DateTimePicker
              value={dateNaissance || new Date(2000, 0, 1)}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(_, selectedDate) => {
                if (selectedDate) setDateNaissance(selectedDate);
              }}
              maximumDate={new Date()}
              locale="fr-FR"
              style={{ width: '100%', height: 150 }}
            />
            <TouchableOpacity style={styles.validateButton} onPress={() => setShowDatePicker(false)}>
              <Text style={styles.validateText}>Valider</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.label}>Adresse e-mail</Text>
        <TextInput value={email} editable={false} style={[styles.input, { backgroundColor: '#eee' }]} />

        <TouchableOpacity
          style={[styles.button, (!isDirty || !isValid || saving) && styles.buttonDisabled]}
          onPress={handleModifier}
          disabled={!isDirty || !isValid || saving}
        >
          <View style={styles.iconButton}>
            <MaterialCommunityIcons name="content-save" size={20} color="#fff" style={styles.icon} />
            <Text style={styles.buttonText}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {toastMsg && (
        <View style={[styles.toast, { bottom: (insets.bottom || 12) + 12 }]}>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  titleIcon: { marginRight: 10 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#007AFF' },

  label: { marginTop: 10, fontWeight: 'bold', color: '#000' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginTop: 5, backgroundColor: '#fff' },

  datePicker: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 15, marginTop: 5, backgroundColor: '#fff',
  },
  inlinePicker: { backgroundColor: '#fff', borderRadius: 12, padding: 10, marginBottom: 20, marginTop: 10 },
  validateButton: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, marginTop: 10, alignItems: 'center' },
  validateText: { color: '#fff', fontWeight: 'bold' },

  iconButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  icon: { marginRight: 8 },
  button: { marginTop: 30, backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center' },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  toast: {
    position: 'absolute', left: 12, right: 12,
    backgroundColor: 'rgba(0,0,0,0.85)', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center',
  },
  toastText: { color: '#fff', fontWeight: '600' },
});
