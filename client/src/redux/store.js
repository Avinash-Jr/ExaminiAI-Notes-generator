// Redux store configuration
// We are using the configureStore function to create a store.
// We are passing the reducer function to the store.
// The reducer function is a function that takes the current state and an action and returns the new state.
// The reducer function is used to update the state of the application.
// The reducer function is used to update the state of the application.
// What reducer do is it basically 
import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice.js";

export const store = configureStore({
    reducer: {
        user: userReducer,
    },
});