import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  nom: string;
}

const initialState: UserState = {
  nom: '',
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setNom: (state, action: PayloadAction<string>) => {
      state.nom = action.payload;
    },
  },
});

export const { setNom } = userSlice.actions;
export default userSlice.reducer;
