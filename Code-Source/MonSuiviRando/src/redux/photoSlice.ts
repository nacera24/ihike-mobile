import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Photo {
  id?: string;
  url?: string;      
  uri?: string;      
  latitude: number;
  longitude: number;
  timestamp: string; 
  adresse?: string;
}


interface PhotoState {
  items: Photo[];
}

const initialState: PhotoState = {
  items: [],
};

const photoSlice = createSlice({
  name: 'photos',
  initialState,
  reducers: {
    setPhotos: (state, action: PayloadAction<Photo[]>) => {
      state.items = action.payload;
    },
    addPhoto: (state, action: PayloadAction<Photo>) => {
      state.items.push(action.payload);
    },
  },
});

export const { setPhotos, addPhoto } = photoSlice.actions;
export default photoSlice.reducer;
