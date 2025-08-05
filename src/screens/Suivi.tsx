import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Image, Modal } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
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
import { addSession } from "../redux/historiqueSlice"; 

//  Calcul distance entre deux points GPS (Haversine)
const haversineDistance = (
  coord1: { latitude: number; longitude: number },
  coord2: { latitude: number; longitude: number }
) => {
  const R = 6371000; // Rayon Terre en m
  const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
  const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;
  const lat1 = coord1.latitude * Math.PI / 180;
  const lat2 = coord2.latitude * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

//  Formatter le chrono en hh:mm:ss
const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export default function Suivi() {
  const dispatch = useDispatch();
  const mapRef = useRef<MapView>(null);
  const cameraRef = useRef<any>(null);

  const { tracking, route, photosSession } = useSelector((state: RootState) => state.rando);

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [watcher, setWatcher] = useState<Location.LocationSubscription | null>(null);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('back');

  const [totalDistance, setTotalDistance] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [selectedPhoto, setSelectedPhoto] = useState<{ uri: string; adresse?: string } | null>(null);

  //  Référence du dernier point pour calculer la distance en live
  const lastPointRef = useRef<{ latitude: number; longitude: number } | null>(null);

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

    //  Reset du parcours
    setTotalDistance(0);
    setElapsedTime(0);
    lastPointRef.current = null; // remet à zéro le dernier point
    const newStartTime = Date.now();
    setStartTime(newStartTime);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - newStartTime) / 1000));
    }, 1000);

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
        distanceInterval: 3,
      },
      (loc) => {
        const point = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        if (loc.coords.accuracy && loc.coords.accuracy > 20) {
          console.log("⚠️ Précision GPS mauvaise :", loc.coords.accuracy);
          return;
        }

        //  Calcule la distance par rapport au dernier point connu
        if (lastPointRef.current) {
          const dist = haversineDistance(lastPointRef.current, point);

          if (dist < 8) return;   // ignorer bruit GPS < 8m
          if (dist > 100) return; // ignorer gros saut GPS

          setTotalDistance(prev => prev + dist);
        }

        //  Sauvegarder ce point comme "dernier point"
        lastPointRef.current = point;

        //  Mise à jour Redux + Firestore
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

  const stopTracking = async () => {
    if (watcher) {
      watcher.remove();
      setWatcher(null);
      dispatch(stopTrackingAction());
    }
    if (timerRef.current) clearInterval(timerRef.current);

    const user = getAuth().currentUser;
    if (user) {
      const endTime = new Date();
      const newSession = {
        startTime,
        endTime: endTime.toISOString(),
        distance: totalDistance,
        duration: elapsedTime,
        route,
        photos: photosSession,
      };

      const docRef = await addDoc(
        collection(db, "suivis", user.uid, "sessions"),
        newSession
      );

      dispatch(addSession({ id: docRef.id, ...newSession }));
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

  const toggleCameraFacing = () => {
    setCameraFacing(prev => (prev === 'back' ? 'front' : 'back'));
  };

  return (
    <View style={styles.container}>
      {location && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {/* Marqueur utilisateur */}
          <Marker coordinate={location.coords}>
            <MaterialCommunityIcons name="walk" size={40} color="blue" />
          </Marker>

          {/* Tracé */}
          {route.length > 1 && (
            <Polyline coordinates={route} strokeWidth={4} strokeColor="blue" />
          )}

          {/*  Photos */}
          {photosSession.map((photo, index) => (
            <Marker
              key={index}
              coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}
              onPress={() => setSelectedPhoto(photo)}
            >
              <Image source={{ uri: photo.uri }} style={{ width: 40, height: 40, borderRadius: 10 }} />
            </Marker>
          ))}
        </MapView>
      )}

      {tracking && (
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>📏 {totalDistance.toFixed(1)} m</Text>
          <Text style={styles.infoText}>⏱ {formatTime(elapsedTime)}</Text>
        </View>
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

      {/*  Aperçu Photo */}
      <Modal
        visible={!!selectedPhoto}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoPreviewContainer}>
          <View style={styles.photoPreviewBox}>
            {selectedPhoto && (
              <>
                <Image source={{ uri: selectedPhoto.uri }} style={styles.photoPreviewImage} resizeMode="contain" />
                {selectedPhoto.adresse && (
                  <Text style={styles.photoPreviewText}>{selectedPhoto.adresse}</Text>
                )}
                <TouchableOpacity
                  style={styles.closePreviewButton}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/*  Modal Caméra corrigé */}
      <Modal visible={cameraVisible} transparent={false}>
        <View style={{ flex: 1 }}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            facing={cameraFacing}
          />
          <View style={styles.buttonContainer}>
            <TouchableOpacity onPress={toggleCameraFacing} style={styles.switchCameraButton}>
              <MaterialCommunityIcons name="camera-flip" size={30} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={takePhoto} style={styles.captureButton} />
          </View>
        </View>
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
  infoBar: {
    position: 'absolute',
    bottom: 90,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    alignSelf: 'center',
  },
  infoText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
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
    bottom: 150,
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
  photoPreviewContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoPreviewBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    width: '80%',
    alignItems: 'center',
  },
  photoPreviewImage: {
    width: '100%',
    height: 300,
    borderRadius: 10,
  },
  photoPreviewText: {
    marginTop: 10,
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  closePreviewButton: {
    marginTop: 10,
    backgroundColor: 'red',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 20,
    zIndex: 2,
  },
  switchCameraButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 15,
    borderRadius: 40,
    marginRight: 20,
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
