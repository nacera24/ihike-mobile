import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { getAuth } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  startTracking as startTrackingAction,
  stopTracking as stopTrackingAction,
  addPoint,
  addPhotoSession,
} from '../redux/randoSlice';
import { getAdresseGoogle } from '../utils/geocoding';

export default function Suivi() {
  const dispatch = useDispatch();
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<any>(null);

  const { tracking, route, photosSession } = useSelector((state: RootState) => state.rando);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

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
    dispatch(startTrackingAction());
    if (location) {
      mapRef.current?.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.001,
        longitudeDelta: 0.001,
      }, 1000);
    }

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
        dispatch(addPoint(point));
        savePointToFirebase(point);

        mapRef.current?.animateToRegion({
          latitude: point.latitude,
          longitude: point.longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        });
      }
    );
    setWatcher(subscription);
  };

  const stopTracking = () => {
    if (watcher) {
      watcher.remove();
      setWatcher(null);
      dispatch(stopTrackingAction());
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
      console.error("Erreur Firebase :", error);
    }
  };

  const openCamera = async () => {
    const { granted } = await requestPermission();
    if (!granted) {
      Alert.alert("Permission refusée", "L'accès à la caméra est requis.");
      return;
    }
    setCameraVisible(true);
  };

  const takePhoto = async () => {
    if (cameraRef.current && location) {
      const photoData: CameraCapturedPicture = await cameraRef.current.takePictureAsync();
      const { latitude, longitude } = location.coords;
      const adresse = await getAdresseGoogle(latitude, longitude);

      const photo = {
        uri: photoData.uri,
        latitude,
        longitude,
        adresse,
        timestamp: new Date().toISOString(),
      };

      dispatch(addPhotoSession(photo));
      const user = getAuth().currentUser;
      if (user) {
        await addDoc(collection(db, 'photos', user.uid, 'items'), photo);
      }
      setCameraVisible(false);
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
        >
          <Marker coordinate={location.coords}>
            <MaterialCommunityIcons name="walk" size={40} color="blue" />
          </Marker>

          {route.length > 1 && (
            <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />
          )}

          {photosSession.map((photo, index) => (
            <Marker key={index} coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}>
              <Image source={{ uri: photo.uri }} style={{ width: 40, height: 40, borderRadius: 10 }} />
            </Marker>
          ))}
        </MapView>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: tracking ? 'red' : 'green' }]}
          onPress={tracking ? stopTracking : startTracking}
        >
          <Text style={styles.buttonText}>
            {tracking ? 'Arrêter la randonnée' : 'Démarrer la randonnée'}
          </Text>
        </TouchableOpacity>
      </View>

      {tracking && (
        <TouchableOpacity style={styles.floatingCameraButton} onPress={openCamera}>
          <MaterialCommunityIcons name="camera" size={30} color="#333" />
        </TouchableOpacity>
      )}

      <Modal visible={cameraVisible} transparent={false}>
        <CameraView ref={cameraRef} style={styles.camera}>
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={takePhoto} style={styles.captureButton} />
          </View>
        </CameraView>
      </Modal>
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
  toggleButton: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  floatingCameraButton: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 3,
    borderColor: '#888',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  camera: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'white',
    borderWidth: 4,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
