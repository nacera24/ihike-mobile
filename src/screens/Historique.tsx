import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { getAuth } from "firebase/auth";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useNavigation } from "@react-navigation/native";

interface Session {
  docId: string; //  ID Firestore 
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

export default function Historique() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    const fetchSessions = async () => {
      const user = getAuth().currentUser;
      if (!user) return;

      const q = query(
        collection(db, "suivis", user.uid, "sessions"),
        orderBy("startTime", "desc")
      );
      const snapshot = await getDocs(q);

      const list: Session[] = snapshot.docs.map(doc => ({
        docId: doc.id, // on garde l'ID Firestore dans docId
        ...(doc.data() as Omit<Session, "docId">) 
      }));

      setSessions(list);
    };

    fetchSessions();
  }, []);

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const formatDuration = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📜 Historique des randonnées</Text>

      <FlatList
        data={sessions}
        keyExtractor={(item) => item.docId}  
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.sessionCard}
            onPress={() =>
              navigation.navigate("DetailRando", { session: item }) //  on passe tout l'objet session
            }
          >
            <Text style={styles.sessionDate}>📅 {formatDate(item.startTime)}</Text>
            <Text>⏱ {formatDuration(item.duration)}</Text>
            <Text>📏 {(item.distance / 1000).toFixed(2)} km</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  sessionCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2
  },
  sessionDate: { fontWeight: "bold", marginBottom: 5 }
});
