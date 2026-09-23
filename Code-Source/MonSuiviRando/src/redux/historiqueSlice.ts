import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface Point {
  latitude: number;
  longitude: number;
}

interface Photo {
  uri: string;
  latitude: number;
  longitude: number;
  adresse?: string;
  timestamp: string;
}

export interface Session {
  id?: string; // il sera rempli après sauvegarde Firestore
  startTime: number | null;
  endTime: string;
  distance: number;
  duration: number;
  route: Point[];
  photos: Photo[];
}

interface HistoriqueState {
  sessions: Session[];
}

const initialState: HistoriqueState = {
  sessions: [],
};

const historiqueSlice = createSlice({
  name: "historique",
  initialState,
  reducers: {
    setSessions(state, action: PayloadAction<Session[]>) {
      state.sessions = action.payload;
    },
    addSession(state, action: PayloadAction<Session>) {
      state.sessions.unshift(action.payload); 
    },
  },
});

export const { setSessions, addSession } = historiqueSlice.actions;
export default historiqueSlice.reducer;
