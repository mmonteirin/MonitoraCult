import React from "react";

import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
} from "react-native";

import { useThemedStyles } from "../../hooks/useThemedStyles";

export default function CategoryPills({
	categorias,
	ativa,
	onChange,
}) {
	const styles = useThemedStyles(createThemedScreenStyles);

	return (
		<ScrollView
			horizontal
			showsHorizontalScrollIndicator={false}
			contentContainerStyle={styles.categoriesContainer}
		>
			{categorias.map((cat) => {
				const active = ativa === cat;

				return (
					<TouchableOpacity
						key={cat}
						activeOpacity={0.95}
						onPress={() => onChange(cat)}
						style={[
							styles.category,

							active &&
								styles.categoryActive,
						]}
					>
						<Text
							style={[
								styles.categoryText,

								active &&
									styles.categoryTextActive,
							]}
						>
							{cat}
						</Text>
					</TouchableOpacity>
				);
			})}
		</ScrollView>
	);
}

function createThemedScreenStyles(c) {
  return StyleSheet.create({
	categoriesContainer: {
		paddingHorizontal: 18,
		marginTop: 22,
	},

	category: {
		paddingHorizontal: 18,
		paddingVertical: 11,
		borderRadius: 22,

		backgroundColor: c.card,

		borderWidth: 1,
		borderColor: c.border,

		marginRight: 10,
	},

	categoryActive: {
		backgroundColor: c.primary,

		borderColor: c.primaryDark,

		shadowColor: c.primary,
		shadowOpacity: 0.35,
		shadowRadius: 14,

		elevation: 8,
	},

	categoryText: {
		color: c.textPrimary,
		fontWeight: "600",
	},

	categoryTextActive: {
		color: c.onPrimary,
		fontWeight: "700",
	},
});
}
