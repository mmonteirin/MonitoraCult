import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import styles from "../styles/StylesIdentidadeVisual";

import EventoProximo from "./EventoProximo";

export default function PerfilMenu({ navigation }) {
	return (
		<View style={styles.principal}>
			{/* Cabeçalho do Perfil */}
			<View style={styles.header_perfil}>
				<View style={styles.avatar_container}>
					<Image
						style={styles.avatar}
						source={{ uri: "https://via.placeholder.com/150" }}
					/>
					<TouchableOpacity onPress={() => navigation.navigate("PerfilGeral")}>
						<Text style={styles.texto_ver_perfil}>Ver Perfil</Text>
					</TouchableOpacity>
				</View>
				<View style={styles.info_perfil}>
					<Text style={styles.nome_perfil}>Nome de Usuario</Text>
					<Text style={styles.subtitulo_perfil}>Tag de Usuario</Text>
				</View>
			</View>

			{/*Lista de Menu*/}
			<View style={styles.menu_container}>
				<TouchableOpacity
					style={styles.menu_item}
					onPress={() => navigation.navigate("TelaInicio")}
				>
					<MaterialCommunityIcons
						name="calendar-outline"
						size={28}
						color="#333333"
					/>
					<Text style={styles.menu_texto}>Linha do Tempo</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.menu_item}
					onPress={() => navigation.navigate("EventoProximo")}
				>
					<MaterialCommunityIcons
						name="information-outline"
						size={28}
						color="#333333"
					/>
					<Text style={styles.menu_texto}>Novidades</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.menu_item}
					onPress={() => navigation.navigate("EventoAvaliacao")}
				>
					<MaterialCommunityIcons
						name="bullhorn-outline"
						size={28}
						color="#333333"
					/>
					<Text style={styles.menu_texto}>Suas avaliações</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.menu_item}
					onPress={() => navigation.navigate("PerfilGeral")}
				>
					<MaterialCommunityIcons
						name="cog-outline"
						size={28}
						color="#333333"
					/>
					<Text style={styles.menu_texto}>Configurações</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.menu_item, { marginTop: 15 }]}
					onPress={() => navigation.navigate("PerfilOcorrencia")}
				>
					<Text style={styles.menu_texto_destaque}>Mensagens de Suporte</Text>
				</TouchableOpacity>
			</View>

			{/*Barra de Navegação Inferior*/}
			<View style={styles.bottom_bar}>
				<TouchableOpacity
					style={styles.bottom_item}
					onPress={() => navigation.navigate("TelaInicio")}
				>
					<MaterialCommunityIcons
						name="home-outline"
						size={28}
						color="#333333"
					/>
					<Text style={styles.bottom_texto}>Início</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.bottom_item}
					onPress={() => navigation.navigate("TelaBusca")}
				>
					<MaterialCommunityIcons name="magnify" size={28} color="#333333" />
					<Text style={styles.bottom_texto}>Busca</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.bottom_item}
					onPress={() => navigation.navigate("TelaFeed")}
				>
					<MaterialCommunityIcons name="rss" size={28} color="#333333" />
					<Text style={styles.bottom_texto}>Feed</Text>
				</TouchableOpacity>

				<TouchableOpacity
					style={styles.bottom_item}
					onPress={() => navigation.navigate("EventoProximo")}
				>
					<MaterialCommunityIcons
						name="ticket-confirmation-outline"
						size={28}
						color="#333333"
					/>
					<Text style={styles.bottom_texto}>Ingressos</Text>
				</TouchableOpacity>

				<TouchableOpacity style={styles.bottom_item}>
					<MaterialCommunityIcons
						name="account-circle-outline"
						size={28}
						color="#4A6FA5"
					/>
					<Text
						style={[
							styles.bottom_texto,
							{ color: "#4A6FA5", fontWeight: "bold" },
						]}
					>
						Perfil
					</Text>
				</TouchableOpacity>
			</View>
		</View>
	);
}