import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useDispatch, useSelector } from 'react-redux';
import { setPhotos, Photo } from '../redux/photoSlice';
import { RootState } from '../redux/store';

export default function MesPhotos() {
  const dispatch = useDispatch();
  const photos = useSelector((state: RootState) => state.photos.items);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(db, 'photos', user.uid, 'items'),
      (snapshot) => {
        let data: Photo[] = snapshot.docs.map((doc) => ({
          ...(doc.data() as Photo),
          id: doc.id, //On garde l'ID Firestore pour la suppression
        }));

        //  Trier par date : les plus récentes en premier
        data = data.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        dispatch(setPhotos(data));
        setLoading(false);
      },
      (error) => {
        console.error('Erreur Firestore :', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [dispatch]);

  const handleDeletePhoto = async (photoId: string) => {
    const user = getAuth().currentUser;
    if (!user) return;

    Alert.alert(
      'Supprimer la photo',
      'Voulez-vous vraiment supprimer cette photo ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'photos', user.uid, 'items', photoId));
              Alert.alert('✅ Photo supprimée');
            } catch (error) {
              console.error('Erreur suppression :', error);
              Alert.alert('❌ Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (photos.length === 0) {
    return (
      <View style={styles.center}>
        <Text>Aucune photo trouvée.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id ?? item.uri}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <Text>📅 {new Date(item.timestamp).toLocaleString()}</Text>
            <Text>📍 {item.adresse}</Text>
            <Text>🌍 ({item.latitude.toFixed(4)}, {item.longitude.toFixed(4)})</Text>

            {/* Bouton Supprimer */}
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => handleDeletePhoto(item.id!)}
            >
              <Text style={{ color: 'white', fontWeight: 'bold' }}>🗑 Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  card: {
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    marginTop: 10,
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
});
