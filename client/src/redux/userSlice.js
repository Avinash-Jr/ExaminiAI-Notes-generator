import { createSlice } from "@reduxjs/toolkit";


const userSlice = createSlice({
    name: "user",
    initialState: {
        userData: null,
    },
    reducers: {
        setUserData: (state, action) => {
            state.userData = action.payload; // action.payload is the data that we are passing to the reducer
        },
    },
});

export const { setUserData } = userSlice.actions;
export default userSlice.reducer;