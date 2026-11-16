import { createAsyncThunk } from "@reduxjs/toolkit";
import { loginRequest } from "./authService";
import type { LoginRequest, LoginResponse } from "./authTypes";

export const loginThunk = createAsyncThunk<
  LoginResponse,
  LoginRequest,
  { rejectValue: string }
>("auth/login", async (data, { rejectWithValue }) => {
  try {
    return await loginRequest(data);
  } catch (e) {
    return rejectWithValue((e as Error).message);
  }
});