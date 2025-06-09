import React, { useEffect, useState } from 'react';
import { View, Text, Image, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { getAuth } from 'firebase/auth';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import * as Location from 'expo-location';

export default function MesPhotos() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getAdresse = async (latitude: number, longitude: number) => {
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results.length > 0) {
        const { street, city, region, country } = results[0];
        return `${street}, ${city}, ${region}, ${country}`;
      }
    } catch (error) {
      console.error('Erreur de géocodage :', error);
    }
    return `${latitude}, ${longitude}`;
  };

  useEffect(() => {
    const fetchPhotos = async () => {
      const user = getAuth().currentUser;
      if (!user) return;

      try {
        const snapshot = await getDocs(collection(db, 'photos', user.uid, 'items'));
        const data = await Promise.all(
          snapshot.docs.map(async doc => {
            const photo = doc.data();
            const adresse = await getAdresse(photo.latitude, photo.longitude);
            return { ...photo, adresse };
          })
        );
        setPhotos(data);
      } catch (error) {
        console.error('Erreur lors du chargement des photos :', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, []);

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
