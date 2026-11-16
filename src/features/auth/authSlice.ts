import { createSlice } from "@reduxjs/toolkit";
import { loginThunk } from "./authThunks";
import type { AuthState } from "./authTypes";

const saved = localStorage.getItem("auth");
const parsed = saved ? JSON.parse(saved) : null;

const initialState: AuthState = {
  user: parsed?.user ?? null,
  token: parsed?.token ?? null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem("auth");
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginThunk.pending, (s) => {
        s.loading = true;
        s.error = null;
      })
      .addCase(loginThunk.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload.user;
        s.token = a.payload.token;
        localStorage.setItem("auth", JSON.stringify(a.payload));
      })
      .addCase(loginThunk.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload ?? "Login failed";
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;