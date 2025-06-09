import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Alert, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { getAuth } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';

export default function Suivi() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [route, setRoute] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [photos, setPhotos] = useState<Array<{ uri: string; latitude: number; longitude: number }>>([]);
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(null);
  const [tracking, setTracking] = useState(false);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert("Permission refusée", "L'application a besoin de la localisation.");
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation);
    })();
  }, []);

  const startTracking = async () => {
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 5,
      },
      (loc) => {
        const point = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setLocation(loc);
        setRoute((prev) => [...prev, point]);
        savePointToFirebase(point);
      }
    );
    setWatcher(subscription);
    setTracking(true);
  };

  const stopTracking = () => {
    if (watcher) {
      watcher.remove();
      setWatcher(null);
      setTracking(false);
    }
  };

  const savePointToFirebase = async (point: { latitude: number; longitude: number }) => {
    const user = getAuth().currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, 'suivis', user.uid, 'points'), {
        latitude: point.latitude,
        longitude: point.longitude,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Erreur lors de l'enregistrement Firebase :", error);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission refusée", "L'accès à la caméra est requis.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.5,
    });

    if (!result.canceled && location) {
            const photo = {
        uri: result.assets[0].uri,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      };

      setPhotos([...photos, photo]);
      //  Ajouter cet enregistrement dans Firestore
      const user = getAuth().currentUser;
      if (user) {
     await addDoc(collection(db, 'photos', user.uid, 'items'), photo);
        }
    }
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
          region={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker coordinate={location.coords} title="Vous êtes ici" />
          {route.length > 1 && <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />}
          {photos.map((photo, index) => (
            <Marker key={index} coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}>
              <Image source={{ uri: photo.uri }} style={{ width: 40, height: 40, borderRadius: 10 }} />
            </Marker>
          ))}
        </MapView>
      )}

      <View style={styles.buttons}>
        {!tracking ? (
          <TouchableOpacity style={styles.startButton} onPress={startTracking}>
            <Text style={styles.buttonText}>Démarrer</Text>
          </TouchableOpacity>
        ) : (
          <>
            <TouchableOpacity style={styles.photoButton} onPress={takePhoto}>
              <Text style={styles.buttonText}>📸 Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopButton} onPress={stopTracking}>
              <Text style={styles.buttonText}>Arrêter</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  buttons: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 20,
    alignSelf: 'center',
  },
  startButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 10,
  },
  stopButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
  },
  photoButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});
