import { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const Context = createContext();

export const Provider = ({ children }) => {
  const [data, setData] = useState([]);

  //Context para guardar sesion
  const [user, setUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(0);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = Platform.OS === "web"
          ? localStorage.getItem("user_session")
          : await SecureStore.getItemAsync("user_session");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);

          if (parsed?.token) {
            const payload = JSON.parse(atob(parsed.token.split(".")[1]));
            const isExpired = payload.exp * 1000 < Date.now();

            if (isExpired) {
              if (Platform.OS === "web") {
                localStorage.removeItem("user_session");
              } else {
                await SecureStore.deleteItemAsync("user_session");
              }

              setUser(null);
              setIsLogged(false);
              setUserId(0);
              setToken(null);
              return;
            }
          }

          setUser(parsed);
          setIsLogged(true);

          if (parsed?.userId) {
            setUserId(parsed.userId);
          } else if (parsed?.id) {
            setUserId(parsed.id);
          }

          if (parsed?.token) {
            setToken(parsed.token);
          }
        }
      } catch (error) {
        console.error("Error recuperando sesión:", error);
      } finally {
        setIsLoading(false);
      }
    };
    checkSession();
  }, []);

  // Función para iniciar sesión 
  const loginUser = async (userData) => {
    try {
      setUser(userData);
      setIsLogged(true);

      if (userData?.userId) {
        setUserId(userData.userId);
      }

      if (userData?.token) {
        setToken(userData.token);
      }

      if (Platform.OS === "web") {
        localStorage.setItem("user_session", JSON.stringify(userData));
      } else {
        await SecureStore.setItemAsync("user_session", JSON.stringify(userData));
      }
    } catch (error) {
      console.error("Error al guardar sesión:", error);
    }
  };

  // Función para cerrar sesión
  const logoutUser = async () => {
    try {
      setUser(null);
      setIsLogged(false);
      setUserId(0);
      setToken(null);
      if (Platform.OS === "web") {
        localStorage.removeItem("user_session");
      } else {
        await SecureStore.deleteItemAsync("user_session");
      }
    } catch (error) {
      console.error("Error al borrar sesión:", error);
    }
  };

  return (
    <Context.Provider value={{
      data,
      setData,
      user,
      isLogged,
      isLoading,
      loginUser,
      logoutUser,
      userId,
      setUserId,
      token,
      setToken
    }}>
      {children}
    </Context.Provider>
  );
};

export default Context;