import { useContext, useEffect } from "react";
import { createStackNavigator } from "@react-navigation/stack";

import { View, ActivityIndicator } from "react-native";

import PerfilUsuario from './perfilUsuario/perfilUsuario';
import MenuTransacciones from './menuTransacciones/menuTransacciones'
import MenuPrincipal from './menuPrincipal/menuPrincipal';
import Billetera from './billetera/billetera';
import MenuNoticias from './menuNoticias/menuNoticias'
import EditarPerfil from "./perfilUsuario/editarPerfil";

import App from '././../../App';

import Context from '../context/Context';

const Stack = createStackNavigator();

const HomeNav = ({ navigation }) => {
const { isLogged, isLoading } = useContext(Context);
const { user, setUser } = useContext(Context);


useEffect(() => {
    if (!isLoading && !isLogged) {
      navigation.navigate('InicioSesion');
    }
      console.log(user);
  }, [isLogged, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#102217' }}>
        <ActivityIndicator size="large" color="#2bee79" />
      </View>
    );
  }

  return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MenuPrincipal" component={MenuPrincipal} />
        <Stack.Screen name="PerfilUsuario" component={PerfilUsuario} />
        <Stack.Screen name="MenuTransacciones" component={MenuTransacciones} />
        <Stack.Screen name="Billetera" component={Billetera} />
        <Stack.Screen name="MenuNoticias" component={MenuNoticias} />
        <Stack.Screen name="EditarPerfil" component={EditarPerfil} />
      </Stack.Navigator>
  );
};

export default HomeNav;