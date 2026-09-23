import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import { setSessions } from "../redux/historiqueSlice";
import type { RootState } from "../redux/store";
import type { Session } from "../redux/historiqueSlice"; 

export default function Historique() {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch();
  const sessions = useSelector((s: RootState) => s.historique.sessions);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getAuth().currentUser;
    if (!user) {
      dispatch(setSessions([]));
      setLoading(false);
      return;
    }

    // Abonnement temps réel + tri côté serveur
    const q = query(
      collection(db, "suivis", user.uid, "sessions"),
      orderBy("startTime", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const list: Session[] = snapshot.docs.map((doc) => {
          const data = doc.data() as Omit<Session, "id">;
          // Normalise l’objet au format attendu  (id = doc.id)
          return { id: doc.id, ...data } as Session;
        });
        dispatch(setSessions(list));
        setLoading(false);
      },
      (err) => {
        console.error("onSnapshot sessions error:", err);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [dispatch]);

  
  const toDate = (v: any): Date | null => {
    try {
      if (v && typeof v === "object" && typeof v.toDate === "function") return v.toDate(); 
      if (typeof v === "number") return new Date(v); 
      const d = new Date(v); 
      return isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  };

  const formatDate = (v: any) => {
    const d = toDate(v);
    return d ? d.toLocaleDateString() + " " + d.toLocaleTimeString() : "—";
  };

  const formatDuration = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const km = (meters: number) => ((meters || 0) / 1000).toFixed(2);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id ?? Math.random().toString(36)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => navigation.navigate("DetailRando", { session: {
                // On passe un objet compatible avec  DetailRando 
                docId: item.id!,
                startTime: item.startTime,
                endTime: item.endTime,
                distance: item.distance,
                duration: item.duration,
                route: item.route,
                photos: item.photos,
              } })}
              activeOpacity={0.8}
            >
              <Text style={styles.sessionDate}>📅 {formatDate(item.startTime)}</Text>
              <Text>⏱ {formatDuration(item.duration)}</Text>
              <Text>📏 {km(item.distance)} km</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>Aucune randonnée enregistrée pour le moment.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f9f9f9" },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 8 },
  listContent: { paddingBottom: 16 },
  sessionCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  sessionDate: { fontWeight: "bold", marginBottom: 6 },
  emptyBox: { marginTop: 40, alignItems: "center" },
  emptyText: { color: "#666" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
});
