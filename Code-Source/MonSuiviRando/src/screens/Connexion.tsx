import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
  signInWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "../firebase/firebaseConfig";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { MaterialCommunityIcons } from "@expo/vector-icons";

// Expo AuthSession
import * as WebBrowser from "expo-web-browser";
import { useAuthRequest } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

type ConnexionScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  "Connexion"
>;

export default function Connexion() {
  const navigation = useNavigation<ConnexionScreenNavigationProp>();

  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nonce, setNonce] = useState(""); 
  const alreadyHandled = useRef(false); 

  //  Redirect URI pour Expo Go
  const redirectUri = "https://auth.expo.io/@sahminacera/MonSuiviRando";

  
  useEffect(() => {
    const newNonce = Math.random().toString(36).substring(2, 15);
    setNonce(newNonce);
    console.log(" Nonce initial généré :", newNonce);
  }, []);

  // Prépare la requête OAuth une seule fois
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId:
        "665570993787-3edjre30dsiht43i1jpa3qr5fem5jqj1.apps.googleusercontent.com",
        
      redirectUri,
      responseType: "id_token",
      usePKCE: false,
      scopes: ["openid", "profile", "email"],
      extraParams: {
        nonce,
        prompt: "select_account",
      },
    },
    {
      authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    }
  );

  //  Fonction pour connecter Firebase 
  const handleFirebaseGoogleLogin = async (idToken: string) => {
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);

      console.log("Firebase OK :", userCredential.user.email);
      Alert.alert("Connexion réussie", `Bienvenue ${userCredential.user.email}`);

      //  Aller vers Home
      navigation.replace("MainApp");
    } catch (err: any) {
      console.error(" Erreur Firebase Auth:", err);
      Alert.alert("Erreur Firebase", err.message);
    }
  };

  // Gestion de la réponse Google OAuth 
  useEffect(() => {
    if (!response || alreadyHandled.current) return;

    if (response.type === "success") {
      alreadyHandled.current = true; 
      const idToken = response.params.id_token;

      if (idToken) {
        console.log("id_token reçu, connexion Firebase...");
        handleFirebaseGoogleLogin(idToken);
      } else {
        console.warn(" Pas d’id_token trouvé !");
        Alert.alert("Erreur", "Impossible d'obtenir un id_token !");
      }
    } else if (response.type === "error") {
      alreadyHandled.current = true;
      console.error(" Erreur Google OAuth :", response.error);
      Alert.alert("Erreur Google OAuth", JSON.stringify(response.error));
    } else if (response.type === "dismiss") {
      alreadyHandled.current = true;
      console.warn(" Authentification annulée par l'utilisateur.");
    }
  }, [response]);

  //  Connexion classique Email + mot de passe
  const handleConnexion = async () => {
    if (!email || !motDePasse) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs.");
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, motDePasse);
      console.log(" Connexion classique réussie :", userCredential.user.email);
      Alert.alert("✅ Succès", "Connexion réussie");

      navigation.replace("MainApp"); 
    } catch (error: any) {
      console.error(" Erreur Email/Mdp:", error);
      Alert.alert("Erreur", error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.title}>Se connecter 🔐</Text>

      {/* Email + Mot de passe */}
      <TextInput
        placeholder="Adresse e-mail"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        placeholder="Mot de passe"
        style={styles.input}
        value={motDePasse}
        onChangeText={setMotDePasse}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleConnexion}>
        <MaterialCommunityIcons
          name="login"
          size={20}
          color="white"
          style={styles.icon}
        />
        <Text style={styles.buttonText}>Connexion</Text>
      </TouchableOpacity>

      {/* Bouton Connexion Google */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: "#fff", marginTop: 20 }]}
        onPress={() => {
          if (!request) return;
          console.log(" Lancement de Google OAuth...");
          alreadyHandled.current = false; 
          promptAsync();
        }}
        disabled={!request}
      >
        <MaterialCommunityIcons
          name="google"
          size={20}
          color="black"
          style={styles.icon}
        />
        <Text style={{ color: "black", fontWeight: "bold" }}>
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
  buttonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  icon: {
    marginRight: 10,
  },
});
