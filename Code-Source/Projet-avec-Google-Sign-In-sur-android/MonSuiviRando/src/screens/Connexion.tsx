import React, { useEffect, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

import {
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, db } from "../firebase/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";

type ConnexionNav = NativeStackNavigationProp<RootStackParamList, "Connexion">;

// petit type pour éviter les erreurs  selon les versions de la lib
type GoogleProfile = {
  email?: string | null;
  name?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  photo?: string | null;
};

/** Crée (si absent) le doc Firestore 'utilisateurs/{uid}' avec les champs voulus */
async function ensureUserDoc(
  firebaseUser: { uid: string; email?: string | null; displayName?: string | null },
  googleProfile?: GoogleProfile
) {
  const ref = doc(db, "utilisateurs", firebaseUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  // On essaie d'avoir prenom/nom depuis Google, sinon on découpe displayName/name
  const fullName =
    googleProfile?.name ??
    firebaseUser.displayName ??
    ""; 

  let prenomFromName = "";
  let nomFromName = "";
  if (fullName.trim()) {
    const parts = fullName.trim().split(/\s+/);
    prenomFromName = parts.slice(0, -1).join(" ") || parts[0] || "";
    nomFromName = parts.length > 1 ? parts[parts.length - 1] : "";
  }

  const prenom =
    googleProfile?.givenName ??
    prenomFromName;

  const nom =
    googleProfile?.familyName ??
    nomFromName;

  const email =
    firebaseUser.email ??
    googleProfile?.email ??
    "";

  // Ecriture dans Firestore 
  await setDoc(
    ref,
    {
      nom,                     
      prenom,               
      email,                  
      genre: "",               
      dateNaissance: null,  
    },
    { merge: true }
  );
}

export default function Connexion() {
  const navigation = useNavigation<ConnexionNav>();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    GoogleSignin.configure({
      webClientId:
        "665570993787-3edjre30dsiht43i1jpa3qr5fem5jqj1.apps.googleusercontent.com",
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    
    });
  }, []);

  // Connexion e‑mail / mot de passe 
  const handleConnexion = async () => {
    if (!email || !motDePasse) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }
    try {
      setLoading(true);
      const cred = await signInWithEmailAndPassword(auth, email, motDePasse);
      await ensureUserDoc(cred.user); // s’assure que le doc existe pour la connexion classique
      Alert.alert("Succès", "Connexion réussie");
      navigation.replace("MainApp");
    } catch (e: any) {
      let msg = "Erreur de connexion";
      if (e.code === "auth/invalid-email") msg = "E-mail invalide.";
      else if (e.code === "auth/user-not-found") msg = "Utilisateur non trouvé.";
      else if (e.code === "auth/wrong-password") msg = "Mot de passe incorrect.";
      Alert.alert("Erreur", msg);
    } finally {
      setLoading(false);
    }
  };

  // Connexion Google 
  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);

      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      // lance le flux Google
      await GoogleSignin.signIn();

      //  récupère le token pour Firebase
      const { idToken } = await GoogleSignin.getTokens();
      if (!idToken) {
        Alert.alert("Erreur", "Impossible de récupérer l'idToken Google.");
        return;
      }

      // lie à Firebase Auth
      const credential = GoogleAuthProvider.credential(idToken);
      const userCred = await signInWithCredential(auth, credential);
      const user = userCred.user;

      // récupère le profil Google de façon sûre 
      const current = await GoogleSignin.getCurrentUser(); // peut être null
      const googleProfile = (current?.user ?? undefined) as GoogleProfile | undefined;

      // crée le doc Firestore si absent (avec tes champs exacts)
      await ensureUserDoc(
        { uid: user.uid, email: user.email, displayName: user.displayName },
        googleProfile
      );

      Alert.alert("Connexion réussie", `Bienvenue ${user.email ?? "!"}`);
      navigation.replace("MainApp");
    } catch (error: any) {
      console.error(" Google Sign-In :", JSON.stringify(error, null, 2));
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert("Annulé", "Connexion annulée par l'utilisateur");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("En cours", "Connexion déjà en cours");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("Erreur", "Google Play Services indisponible");
      } else {
        Alert.alert("Erreur", error?.message || "Erreur inconnue");
      }
    } finally {
      setLoading(false);
    }
  };

  
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Se connecter 🔐</Text>

      <TextInput
        placeholder="Adresse e-mail"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      <TextInput
        placeholder="Mot de passe"
        style={styles.input}
        value={motDePasse}
        onChangeText={setMotDePasse}
        secureTextEntry
        editable={!loading}
      />

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={handleConnexion}
        disabled={loading}
      >
        <MaterialCommunityIcons name="login" size={20} color="#fff" style={styles.icon} />
        <Text style={styles.buttonText}>{loading ? "Patientez..." : "Connexion"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: "#fff", marginTop: 20 },
          loading && styles.buttonDisabled,
        ]}
        onPress={handleGoogleSignIn}
        disabled={loading}
      >
        <MaterialCommunityIcons name="google" size={20} color="#000" style={styles.icon} />
        <Text style={{ color: "#000", fontWeight: "bold" }}>
          Se connecter avec Google
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
    backgroundColor: "#f0f8ff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 30,
    textAlign: "center",
    color: "#007AFF",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    backgroundColor: "#fff",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  icon: { marginRight: 10 },
});
