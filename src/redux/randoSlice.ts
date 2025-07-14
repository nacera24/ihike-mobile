import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Point {
  latitude: number;
  longitude: number;
}

interface Photo {
  uri: string;
  latitude: number;
  longitude: number;
  timestamp: string;
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
      state.route = [];
      state.tracking = true;
      state.photosSession = [];
    },
    stopTracking(state) {
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
