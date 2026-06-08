import { createSlice } from "@reduxjs/toolkit";

// Load saved auth from localStorage on startup
const saved = JSON.parse(localStorage.getItem("auth") || "null");

const initialState = saved || {
  token: null,
  email: null,
  role: null,
  isAuthenticated: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess: (state, action) => {
      state.token = action.payload.token;
      state.email = action.payload.email;
      state.role = action.payload.role;
      state.isAuthenticated = true;
      localStorage.setItem("auth", JSON.stringify(state));
    },
    logout: (state) => {
      state.token = null;
      state.email = null;
      state.role = null;
      state.isAuthenticated = false;
      localStorage.removeItem("auth");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;