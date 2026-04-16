import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#202020",
		justifyContent: "center",
		alignItems: "center",
		paddingBlock: "7.5rem",
	},

	input_wrapper: {
		width: "17.5rem",
		marginBottom: "1rem",
	},

	label: {
		fontSize: "1.5rem",
		fontWeight: 500,
		color: "white",
		marginBottom: ".5rem",
	},

	input: {
		backgroundColor: "#888888",
		borderRadius: ".25rem",
		paddingBlock: ".75rem",
		paddingInline: ".5rem",
		color: "white",
	},

	button: {
		width: "15rem",
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#2665c4",
		borderRadius: "0.25rem",
		paddingBlock: "1rem",
	},

	buttonText: {
		fontFamily: "sans-serif",
		fontSize: "1.25rem",
		fontWeight: 600,
		color: "white",
	},

	error: {
		fontFamily: "sans-serif",
		fontWeight: 400,
		fontSize: 14,
		color: "red",
    marginBottom: "0.5rem"
	},
});

export default styles;
