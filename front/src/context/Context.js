import { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

const Context = createContext();

export const Provider = ({ children }) => {
  const [data, setData] = useState([]);

  //Context para guardar sesion
  const [user, setUser] = useState(null);
  const [isLogged, setIsLogged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedUser = await SecureStore.getItemAsync('user_session');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          setUser(parsed);
          setIsLogged(true);

          if (parsed?.userId) {
            setUserId(parsed.userId);
          } else if (parsed?.id) {
            setUserId(parsed.id);
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
      await SecureStore.setItemAsync('user_session', JSON.stringify(userData));
    } catch (error) {
      console.error("Error al guardar sesión:", error);
    }
  };

  // Función para cerrar sesión
  const logoutUser = async () => {
    try {
      setUser(null);
      setIsLogged(false);
      await SecureStore.deleteItemAsync('user_session');
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
      setUserId
    }}>
      {children}
    </Context.Provider>
  );
};

export default Context;