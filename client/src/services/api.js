
import axios from "axios";
import { serverUrl } from "../App.jsx";
import { setUserData } from "../redux/userSlice.js";

export const getCurrentUser = async (dispatch) => {
  try {
    const result = await axios.get(
      `${serverUrl}/api/user/currentuser`,
      {
        withCredentials: true,
      }
    );

    console.log("✅ Current user response:", result.data);

    // Store user data in Redux
    dispatch(setUserData(result.data));

    return result.data;
  } catch (error) {
    /* 401 is the normal answer for someone who simply is not signed in. Logging
       it as an error filled the console with red on every visit, which is part
       of why a genuinely broken sign-in was so hard to spot. */
    if (error.response?.status === 401) {
      console.log("ℹ️ No active session — rendering signed out.");
    } else {
      console.error(
        "❌ getCurrentUser failed:",
        error.response?.data || error.message
      );
    }

    // User is not authenticated
    dispatch(setUserData(null));

    return null;
  }
};

