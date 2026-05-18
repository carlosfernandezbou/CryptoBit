import React, { useEffect, useState, useContext } from "react";
import { View, ActivityIndicator } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { createStackNavigator } from "@react-navigation/stack";
import { NavigationContainer } from "@react-navigation/native";
import { Provider } from "./src/context/Context";
import Context from "./src/context/Context"; // NUEVO
import { SettingsProvider } from "./src/context/SettingsContext";

import InicioSesion from "./src/screens/inicioSesion/inicioSesion";
import RegistroUsuario from "./src/screens/registroUsuario/registroUsuario";
import HomeNav from "./src/screens/HomeNav";
import LegalModal from "./src/screens/registroUsuario/LegalModal";

SplashScreen.preventAutoHideAsync().catch(() => { });

const Stack = createStackNavigator();

const App = () => {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync().catch(() => { });
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return <View style={{ flex: 1, backgroundColor: "#0f172a" }} />;
  }

  function AppNavigator() {

    const { isLogged, isLoading } = useContext(Context);

    if (isLoading) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center"
          }}
        >
          <ActivityIndicator size="large" />
        </View>
      );
    }

    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>

          {isLogged ? (
            <>
              <Stack.Screen
                name="HomeNav"
                component={HomeNav}
              />
            </>
          ) : (
            <>
              <Stack.Screen
                name="InicioSesion"
                component={InicioSesion}
              />
              <Stack.Screen
                name="RegistroUsuario"
                component={RegistroUsuario}
              />
            </>
          )}

          <Stack.Screen
            name="LegalModal"
            component={LegalModal}
          />

        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <Provider>
      <SettingsProvider>
        <AppNavigator />
      </SettingsProvider>
    </Provider>
  );
};

export default App;