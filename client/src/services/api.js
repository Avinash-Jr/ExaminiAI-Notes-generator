
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
    console.error(
      "❌ getCurrentUser failed:",
      error.response?.data || error.message
    );

    // User is not authenticated
    dispatch(setUserData(null));

    return null;
  }
};

