import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, onSnapshot } from 'firebase/firestore';
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
        const data: Photo[] = snapshot.docs.map((doc) => doc.data() as Photo);
        dispatch(setPhotos(data));
        setLoading(false);
      },
      (error) => {
        console.error('Erreur lors de l’écoute Firestore :', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [dispatch]);

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
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.uri }} style={styles.image} />
            <Text>📅 {new Date(item.timestamp).toLocaleString()}</Text>
            <Text>📍 {item.adresse}</Text>
            <Text>🌍 ({item.latitude.toFixed(4)}, {item.longitude.toFixed(4)})</Text>
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
});
