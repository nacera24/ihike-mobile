import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Point {
  latitude: number;
  longitude: number;
}

interface Photo {
  id?: string;
  url?: string;     
  uri?: string;      
  latitude: number;
  longitude: number;
  timestamp: string; 
  adresse?: string;
}


interface RandoState {
  route: Point[];
  tracking: boolean;
  photosSession: Photo[];
}

const initialState: RandoState = {
  route: [],
  tracking: false,
  photosSession: [],
};

const randoSlice = createSlice({
  name: 'rando',
  initialState,
  reducers: {
    startTracking(state) {
      // Efface l'ancien tracé uniquement quand on démarre une nouvelle randonnée
      state.route = [];
      state.photosSession = [];
      state.tracking = true;
    },
    stopTracking(state) {
      //  On arrête juste le suivi, mais on garde le tracé visible
      state.tracking = false;
    },
    addPoint(state, action: PayloadAction<Point>) {
      state.route.push(action.payload);
    },
    addPhotoSession(state, action: PayloadAction<Photo>) {
      state.photosSession.push(action.payload);
    },
  },
});
export const { startTracking, stopTracking, addPoint, addPhotoSession } = randoSlice.actions;
export default randoSlice.reducer;
