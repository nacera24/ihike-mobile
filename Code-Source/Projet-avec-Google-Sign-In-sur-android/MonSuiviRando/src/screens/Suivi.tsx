import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Alert, Image, Modal, Platform } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { CameraView, useCameraPermissions, CameraCapturedPicture } from 'expo-camera';
import { getAuth } from 'firebase/auth';
import { addDoc, collection } from 'firebase/firestore';
import { db, storage } from '../firebase/firebaseConfig';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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
import { getPreciseDistance } from 'geolib';

//  Calcul distance précise 
const preciseDistance = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number }
) => getPreciseDistance(a, b);

// Formatter chrono 
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

  const [selectedPhoto, setSelectedPhoto] = useState<{ url?: string; uri?: string; adresse?: string } | null>(null);

  
  const lastPointRef = useRef<{ latitude: number; longitude: number } | null>(null);
  const lastTsRef = useRef<number | null>(null);

  //  Demande de permission + position initial
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

  // Lancer le suivi 
  const startTracking = async () => {
    dispatch(startTrackingAction());

    // Reset parcours
    setTotalDistance(0);
    setElapsedTime(0);
    lastPointRef.current = null;
    lastTsRef.current = null;

    const newStartTime = Date.now();
    setStartTime(newStartTime);

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      const now = Date.now();
      setElapsedTime(Math.floor((now - newStartTime) / 1000));
    }, 1000);

    if (location) {
      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.001,
          longitudeDelta: 0.001,
        },
        1000
      );
    }

    // position avec meilleure précision + filtres anti-bruit
    const subscription = await Location.watchPositionAsync(
      {
        accuracy: Platform.OS === 'ios'
          ? Location.Accuracy.BestForNavigation
          : Location.Accuracy.Highest,
        timeInterval: 2000,   // 2s
        distanceInterval: 5,  // 5 à 10m pour la rando
        mayShowUserSettingsDialog: true,
      },
      (loc) => {
        const acc = loc.coords.accuracy ?? 999; // précision en mètres
        if (acc > 20) return; // rejeter points trop imprécis

        const point = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        //  accepter le 1er point "propre"
        if (!lastPointRef.current) {
          lastPointRef.current = point;
          lastTsRef.current = Date.now();

          setLocation(loc);
          dispatch(addPoint(point));
      
          savePointToFirebase(point).catch((e) => console.log('savePointToFirebase (1):', e?.message));

          return;
        }

      
        const now = Date.now();
        const dt = Math.max(1, (now - (lastTsRef.current ?? now)) / 1000); // s
        const dist = preciseDistance(lastPointRef.current, point);          // m

        // Seuil  en fonction de la précision pour éviter le jitter
        const minStep = Math.max(5, acc * 0.8); 
        if (dist < minStep) return;

        // Anti-sauts : vitesse max plausible 
        const speed = dist / dt;
        if (speed > 7) return;

        // on accepte le point
        setTotalDistance((prev) => prev + dist);
        lastPointRef.current = point;
        lastTsRef.current = now;

        setLocation(loc);
        dispatch(addPoint(point));
        // Option "temps réel"
        savePointToFirebase(point).catch((e) => console.log('savePointToFirebase (2):', e?.message));

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

  //  Recalcul final propre 
  const computeRouteDistance = (coords: { latitude: number; longitude: number }[]) => {
    let total = 0;
    for (let i = 1; i < coords.length; i++) {
      total += preciseDistance(coords[i - 1], coords[i]);
    }
    return total;
  };

  const stopTracking = async () => {
    if (watcher) {
      watcher.remove();
      setWatcher(null);
      dispatch(stopTrackingAction());
    }
    if (timerRef.current) clearInterval(timerRef.current);

    const user = getAuth().currentUser;
    if (!user) return;

    try {
      const endTime = new Date();

      // recalcul propre sur l'itinéraire conservé 
      const finalDistance = computeRouteDistance(route);

      const newSession = {
        startTime: startTime ? new Date(startTime).toISOString() : new Date().toISOString(), 
        endTime: endTime.toISOString(),
        distance: finalDistance,
        duration: elapsedTime,
        route,
        photos: photosSession, 
      };

      const docRef = await addDoc(
        collection(db, 'suivis', user.uid, 'sessions'),
        newSession
      );

    
      console.log('Session créée:', docRef.id);
    } catch (e: any) {
      console.error('Erreur création session :', e);
      Alert.alert('Erreur', e?.message ?? 'Impossible d’enregistrer la session');
    }
  };

  // Enregistrer chaque point 
  const savePointToFirebase = async (point: { latitude: number; longitude: number }) => {
    const user = getAuth().currentUser;
    if (!user) return;
    await addDoc(collection(db, 'suivis', user.uid, 'points'), {
      latitude: point.latitude,
      longitude: point.longitude,
      timestamp: new Date().toISOString(),
    });
  };

  //  Caméra 
  const openCamera = async () => {
    const { granted } = await requestPermission();
    if (!granted) {
      Alert.alert('Permission refusée', "L'accès à la caméra est requis.");
      return;
    }
    setCameraVisible(true);
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !location) return;

    try {
      // Prendre la photo
      const photoData: CameraCapturedPicture = await cameraRef.current.takePictureAsync();
      const { latitude, longitude } = location.coords;

      // Geocoding (adresse lisible)
      const adresse = await getAdresseGoogle(latitude, longitude);

      //  Upload vers Firebase Storage
      const user = getAuth().currentUser;
      if (!user) {
        Alert.alert('Session expirée', 'Veuillez vous reconnecter.');
        return;
      }

      const filePath = `photos/${user.uid}/${Date.now()}.jpg`;
      const storageRef = ref(storage, filePath);

      const resp = await fetch(photoData.uri);
      const blob = await resp.blob();
      // contentType pour matcher la règle Storage (image/*)
      await uploadBytes(storageRef, blob, { contentType: blob.type || 'image/jpeg' });

      //Récupérer l’URL HTTPS
      const downloadURL = await getDownloadURL(storageRef);

      // Mettre à jour Redux (session en cours)
      const photo = {
        url: downloadURL,
        
        latitude,
        longitude,
        adresse,
        timestamp: new Date().toISOString(),
      };
      dispatch(addPhotoSession(photo));

      // Enregistrer aussi dans la galerie Firestore
      await addDoc(collection(db, 'photos', user.uid, 'items'), {
        url: downloadURL,
        latitude,
        longitude,
        adresse,
        timestamp: new Date().toISOString(),
      });

      setCameraVisible(false);
    } catch (e: any) {
      console.log('Erreur takePhoto:', e?.message);
      Alert.alert('Erreur', "Impossible d'enregistrer la photo.");
    }
  };

  const toggleCameraFacing = () => {
    setCameraFacing((prev) => (prev === 'back' ? 'front' : 'back'));
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

          {/* Photos */}
          {photosSession.map((photo, index) => {
            const key = `${photo.timestamp}-${photo.latitude}-${photo.longitude}-${index}`;
            const thumb = photo.url ?? photo.uri;
            return (
              <Marker
                key={key}
                coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}
                onPress={() => setSelectedPhoto(photo)}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={{ width: 40, height: 40, borderRadius: 10 }} />
                ) : (
                  <MaterialCommunityIcons name="image-off" size={30} color="#999" />
                )}
              </Marker>
            );
          })}
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

      {/* Aperçu Photo */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.photoPreviewContainer}>
          <View style={styles.photoPreviewBox}>
            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: selectedPhoto.url ?? selectedPhoto.uri }}
                  style={styles.photoPreviewImage}
                  resizeMode="contain"
                />
                {selectedPhoto.adresse && (
                  <Text style={styles.photoPreviewText}>{selectedPhoto.adresse}</Text>
                )}
                <TouchableOpacity
                  style={styles.closePreviewButton}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modal Caméra */}
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