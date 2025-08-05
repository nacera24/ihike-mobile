import React, { useState } from "react";
import { View, Text, StyleSheet, Dimensions, Image, TouchableOpacity, Modal } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { RouteProp, useRoute } from "@react-navigation/native";

interface Session {
  docId: string;
  startTime: string;
  endTime: string;
  distance: number;
  duration: number;
  route: { latitude: number; longitude: number }[];
  photos: {
    uri: string;
    latitude: number;
    longitude: number;
    adresse?: string;
    timestamp: string;
  }[];
}

export default function DetailRando() {
  const routeParams = useRoute<RouteProp<{ params: { session: Session } }, "params">>();
  const { session } = routeParams.params;

  //  Modal pour afficher une photo en grand
  const [selectedPhoto, setSelectedPhoto] = useState<Session["photos"][0] | null>(null);

  //  Centre la carte sur le 1er point ou par défaut
  const center =
    session.route.length > 0
      ? session.route[0]
      : { latitude: 48.45, longitude: -68.52 };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  };

  return (
    <View style={styles.container}>
      {/*  Infos rapides */}
      <Text style={styles.info}>
        📅 {new Date(session.startTime).toLocaleDateString()}  
        ⏱ {(session.duration / 60).toFixed(1)} min  
        📏 {(session.distance / 1000).toFixed(2)} km
      </Text>

      {/*  Carte */}
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
        {/* Tracé du trajet */}
        {session.route.length > 1 && (
          <Polyline coordinates={session.route} strokeWidth={4} strokeColor="blue" />
        )}

        {/* Photos en marqueurs cliquables */}
        {session.photos.map((photo, index) => (
          <Marker
            key={index}
            coordinate={{ latitude: photo.latitude, longitude: photo.longitude }}
            onPress={() => setSelectedPhoto(photo)} //  Quand on clique on ouvre modal
          >
            <Image
              source={{ uri: photo.uri }}
              style={{ width: 40, height: 40, borderRadius: 8 }}
            />
          </Marker>
        ))}
      </MapView>

      {/*  Modal Photo détaillée */}
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
                  source={{ uri: selectedPhoto.uri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
                <Text style={styles.modalText}>📍 {selectedPhoto.adresse ?? "Adresse inconnue"}</Text>
                <Text style={styles.modalText}>📅 {formatDate(selectedPhoto.timestamp)}</Text>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedPhoto(null)}
                >
                  <Text style={{ color: "white", fontWeight: "bold" }}>Fermer</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  info: {
    padding: 10,
    backgroundColor: "#eee",
    textAlign: "center",
    fontWeight: "bold"
  },
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    width: "80%",
    alignItems: "center",
  },
  modalImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
  },
  modalText: {
    marginTop: 10,
    fontSize: 14,
    color: "#333",
    textAlign: "center",
  },
  closeButton: {
    marginTop: 15,
    backgroundColor: "red",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 5,
  },
});
