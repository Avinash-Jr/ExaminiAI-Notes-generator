import axios from "axios";
import { serverUrl } from "../App.jsx";
import { setUserData } from "../redux/userSlice.js";

export const getCurrentUser = async (dispatch) => {
  try {
    // Fetch currently logged-in user's data from backend
    const result = await axios.get(
      `${serverUrl}/api/user/currentuser`,
      {
        withCredentials: true,
      }
    );

    console.log(result.data);

    // Store current user data in Redux
    dispatch(setUserData(result.data));

    return result.data;
  } catch (error) {
    console.log(error);

    // Clear Redux user data when request fails
    dispatch(setUserData(null));

    return null;
  }
};

