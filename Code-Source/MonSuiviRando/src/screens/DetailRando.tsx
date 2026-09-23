import React, { useState } from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity, Modal } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { RouteProp, useRoute } from "@react-navigation/native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

type LatLng = { latitude: number; longitude: number };
type Photo = {
  url?: string;       
  uri?: string;        
  latitude: number;
  longitude: number;
  adresse?: string;
  timestamp: any; 
};

interface Session {
  docId: string;
  startTime: any; 
  endTime: any;   
  distance: number; 
  duration: number; 
  route: LatLng[];
  photos: Photo[];
}

export default function DetailRando() {
  const routeParams = useRoute<RouteProp<{ params: { session: Session } }, "params">>();
  const { session } = routeParams.params;
  const insets = useSafeAreaInsets();

  // Photo affichée en plein écran
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

  
  const toDate = (v: any): Date | null => {
    try {
      if (v && typeof v === "object" && typeof v.toDate === "function") return v.toDate(); // Firestore Timestamp
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    } catch { return null; }
  };
  const formatDate = (v: any) => {
    const d = toDate(v);
    if (!d) return "—";
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };
  const formatDuration = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };
  const km = (m: number) => ((m || 0) / 1000).toFixed(2);

  const center: LatLng =
    session.route && session.route.length > 0
      ? session.route[0]
      : { latitude: 48.45, longitude: -68.52 };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Bande info en haut */}
      <View style={[styles.info, { paddingTop: 8 }]}>
        <Text style={styles.infoText}>
          📅 {formatDate(session.startTime)}   ⏱ {formatDuration(session.duration)}   📏 {km(session.distance)} km
        </Text>
      </View>

      {/* Carte */}
      <View style={[styles.mapWrapper, { paddingBottom: insets.bottom }]}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          {session.route.length > 1 && (
            <Polyline coordinates={session.route} strokeWidth={4} strokeColor="blue" />
          )}

          {session.photos.map((photo, index) => {
            const thumb = photo.url ?? photo.uri;
            const key = `${photo.timestamp}-${photo.latitude}-${photo.longitude}-${index}`;
            return (
              <Marker
                key={key}
                coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}
                onPress={() => setSelectedPhoto(photo)}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={{ width: 40, height: 40, borderRadius: 8 }} />
                ) : (
                  <View style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: '#ddd', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#666' }}>N/A</Text>
                  </View>
                )}
              </Marker>
            );
          })}
        </MapView>
      </View>

      {/* Modal photo */}
      <Modal
        visible={!!selectedPhoto}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            {selectedPhoto && (
              <>
                <Image
                  source={{ uri: (selectedPhoto.url ?? selectedPhoto.uri)! }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <Text style={styles.modalText}>📍 {selectedPhoto.adresse ?? "Adresse inconnue"}</Text>
                <Text style={styles.modalText}>📅 {formatDate(selectedPhoto.timestamp)}</Text>
                <TouchableOpacity style={styles.closeButton} onPress={() => setSelectedPhoto(null)}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  info: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#eee",
  },
  infoText: { textAlign: "center", fontWeight: "bold" },
  mapWrapper: { flex: 1 },
  map: { flex: 1, width: "100%" },

  modalContainer: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center", alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff", borderRadius: 10, padding: 15, width: "85%", alignItems: "center",
  },
  modalImage: { width: "100%", height: 250, borderRadius: 10 },
  modalText: { marginTop: 10, fontSize: 14, color: "#333", textAlign: "center" },
  closeButton: { marginTop: 15, backgroundColor: "red", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 6 },
});
