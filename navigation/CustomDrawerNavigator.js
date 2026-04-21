import React from "react";
import { View, Text, Image } from "react-native";
import {
  DrawerContentScrollView,
  DrawerItemList,
  DrawerItem,
} from "@react-navigation/drawer";
import styles from "../styles/Styles_Drawer";

export default function CustomDrawerContent(props) {
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.header}>
        <Image
          source={{ uri: "https://i.pravatar.cc/100" }}
          style={styles.avatar}
        />
        <Text style={styles.user}>Marcos Monteiro</Text>
        <Text style={styles.legenda}>Amante de musica</Text>
      </View>

      <DrawerItemList {...props} />

      <DrawerItem label="Sair" onPress={() => console.log("Logout")} />

      <View style={styles.rodape}>
        <Text style={styles.rodapeTexto}>0.2.0</Text>
      </View>
    </DrawerContentScrollView>
  );
}
