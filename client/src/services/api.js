
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

export const generateNotes = async(payload)=>{
  try{
    const result = await axios.post(`${serverUrl}/api/notes/generate-notes`, payload, {
      withCredentials: true,
    });
    return result.data;
  } catch(error){
    console.error("❌ generateNotes failed:", error.response?.data || error.message);
    throw error;
  }
}
  
/**
 * Ends the session: clears the cookie on the server, then clears Redux.
 *
 * Navigation is left to the caller, because where you go next depends on where
 * you pressed it — the navbar menu and the settings page both use this.
 */
export const logout = async (dispatch) => {
  try {
    console.log("🔵 Logging out...");

    await axios.get(`${serverUrl}/api/auth/logout`, {
      withCredentials: true,
    });

    console.log("✅ Logged out successfully");
  } catch (error) {
    console.error(
      "❌ Logout request failed:",
      error.response?.data || error.message
    );
  } finally {
    /* Clear locally whatever the server said. Leaving someone apparently signed
       in after they asked to leave is worse than a stale cookie. */
    dispatch(setUserData(null));
  }
};

