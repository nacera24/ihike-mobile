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
import { db, storage } from '../firebase/firebaseConfig';
import { ref, deleteObject } from 'firebase/storage';
import { useDispatch, useSelector } from 'react-redux';
import { setPhotos, Photo } from '../redux/photoSlice';
import { RootState } from '../redux/store';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MesPhotos() {
  const dispatch = useDispatch();
  const photos = useSelector((state: RootState) => state.photos.items);
  const [loading, setLoading] = useState(true);

  
  const toDate = (v: any): Date | null => {
    try {
      if (v && typeof v === 'object' && typeof v.toDate === 'function') {
        return v.toDate(); 
      }
      const d = new Date(v); 
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const formatDateTime = (v: any) => {
    const d = toDate(v);
    return d ? d.toLocaleString() : '—';
  };

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) return;

    const unsubscribe = onSnapshot(
      collection(db, 'photos', user.uid, 'items'),
      (snapshot) => {
        let data: Photo[] = snapshot.docs.map((d) => ({
          ...(d.data() as Photo),
          id: d.id, 
        }));

        // Trier par timestamp 
        data = data.sort((a, b) => {
          const tb = toDate(b.timestamp)?.getTime() ?? 0;
          const ta = toDate(a.timestamp)?.getTime() ?? 0;
          return tb - ta;
        });

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

  const handleDeletePhoto = async (photo: Photo) => {
    const user = getAuth().currentUser;
    if (!user) return;
    if (!photo.id) {
      Alert.alert('Erreur', "ID de la photo manquant.");
      return;
    }

    Alert.alert('Supprimer la photo', 'Voulez-vous vraiment supprimer cette photo ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            // 1) Supprime le fichier Storage si on a une URL HTTPS
            if (photo.url) {
              try {
                const fileRef = ref(storage, photo.url); 
                await deleteObject(fileRef);
              } catch (e) {
                console.warn('Suppression Storage (ignorée) :', (e as any)?.message);
              }
            }

            // 2) Supprime le doc Firestore 
            await deleteDoc(doc(db, `photos/${user.uid}/items/${photo.id}`));

            Alert.alert('✅ Photo supprimée');
          } catch (error) {
            console.error('Erreur suppression :', error);
            Alert.alert('❌ Erreur lors de la suppression');
          }
        },
      },
    ]);
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
      <SafeAreaView style={styles.safe}>
        <View style={[styles.center, { padding: 20 }]}>
          <Text>Aucune photo trouvée.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <FlatList
          data={photos}
          keyExtractor={(item) =>
            item.id ?? item.url ?? item.uri ?? `${item.latitude}-${item.longitude}-${item.timestamp}`
          }
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => {
            const img = item.url ?? item.uri;
            return (
              <View style={styles.card}>
                {img ? (
                  <Image source={{ uri: img }} style={styles.image} />
                ) : (
                  <View style={[styles.image, styles.imageFallback]}>
                    <Text style={{ color: '#666' }}>Image indisponible</Text>
                  </View>
                )}
                <Text>📅 {formatDateTime(item.timestamp)}</Text>
                <Text>📍 {item.adresse || 'Adresse inconnue'}</Text>
                <Text>
                  🌍 ({item.latitude.toFixed(4)}, {item.longitude.toFixed(4)})
                </Text>

                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDeletePhoto(item)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>🗑 Supprimer</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, padding: 20 },
  card: {
    marginBottom: 20,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  imageFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  deleteButton: {
    marginTop: 10,
    backgroundColor: 'red',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
});
