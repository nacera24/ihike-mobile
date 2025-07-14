import { configureStore } from '@reduxjs/toolkit';
import userReducer from './userSlice';
import photoReducer from './photoSlice';
import randoReducer from './randoSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
    photos: photoReducer,
    rando: randoReducer,
  },
});

// Types pour utiliser Redux avec TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
