import {
	createContext,
	useContext,
	useEffect,
	useState,
	useMemo,
} from "react";

import {
	onAuthStateChanged,
	signOut,
} from "firebase/auth";

import {
	doc,
	getDoc,
} from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";

import {
	auth,
	db,
} from "../firebaseConfig";

const AuthContext =
	createContext({});

export function AuthProvider({
	children,
}) {
	const [user, setUser] =
		useState(null);

	const [profile, setProfile] =
		useState(null);

	const [loading, setLoading] =
		useState(true);

	/* =====================================================
	   BUILD USER DATA
	===================================================== */

	const buildUserData = (
		userAuth,
		dbData = {}
	) => {
		return {
			uid: userAuth.uid,

			email:
				userAuth.email || "",

			nome:
				dbData.nome ||
				userAuth.displayName ||
				userAuth.email?.split(
					"@"
				)[0] ||
				"Usuário",

			foto:
				dbData.foto ||
				userAuth.photoURL ||
				"https://i.pravatar.cc/150",

			role: (
				dbData.role || "user"
			).toLowerCase(),

			areaAtuacao:
				dbData.areaAtuacao ||
				null,

			localAtuacao:
				dbData.localAtuacao ||
				null,

			cnpj:
				dbData.cnpj || null,
		};
	};

	/* =====================================================
	   LOAD CACHE
	===================================================== */

	useEffect(() => {
		const loadCache =
			async () => {
				try {
					const cached =
						await AsyncStorage.getItem(
							"@auth_user"
						);

					if (cached) {
						setProfile(
							JSON.parse(
								cached
							)
						);
					}
				} catch (error) {
					console.log(
						"Erro cache:",
						error
					);
				}
			};

		loadCache();
	}, []);

	/* =====================================================
	   FIREBASE AUTH
	===================================================== */

	useEffect(() => {
		const unsubscribe =
			onAuthStateChanged(
				auth,
				async (
					userAuth
				) => {
					console.log(
						"Firebase state changed:",
						userAuth?.email
					);

					/* SEM LOGIN */
					if (!userAuth) {
						setUser(
							null
						);

						setProfile(
							null
						);

						await AsyncStorage.removeItem(
							"@auth_user"
						);

						setLoading(
							false
						);

						return;
					}

					try {
						setUser(
							userAuth
						);

						/* GARANTE UID */
						if (
							!userAuth.uid
						) {
							setLoading(
								false
							);

							return;
						}

						const docRef =
							doc(
								db,
								"users",
								userAuth.uid
							);

						const snap =
							await getDoc(
								docRef
							);

						let dbData =
							{};

						/* DOC EXISTE */
						if (
							snap.exists()
						) {
							dbData =
								snap.data();
						} else {
							console.log(
								"Usuário sem documento no Firestore"
							);
						}

						const userData =
							buildUserData(
								userAuth,
								dbData
							);

						setProfile(
							userData
						);

						await AsyncStorage.setItem(
							"@auth_user",
							JSON.stringify(
								userData
							)
						);
					} catch (
						error
					) {
						console.log(
							"ERRO FIRESTORE AUTH:",
							error
						);

						/* FALLBACK */
						setProfile(
							{
								uid:
									userAuth.uid,

								email:
									userAuth.email,

								nome:
									userAuth.displayName ||
									"Usuário",

								role:
									"user",

								foto:
									userAuth.photoURL ||
									"https://i.pravatar.cc/150",
							}
						);
					}

					setLoading(
						false
					);
				}
			);

		return unsubscribe;
	}, []);

	/* =====================================================
	   LOGOUT
	===================================================== */

	const logout =
		async () => {
			try {
				await AsyncStorage.removeItem(
					"@auth_user"
				);

				await signOut(auth);

				setUser(null);

				setProfile(null);

				return true;
			} catch (error) {
				console.log(
					error
				);

				throw error;
			}
		};

	/* =====================================================
	   REFRESH PROFILE
	===================================================== */

	const refreshProfile =
		async () => {
			try {
				const currentUser =
					auth.currentUser;

				if (
					!currentUser
				)
					return;

				const docRef =
					doc(
						db,
						"users",
						currentUser.uid
					);

				const snap =
					await getDoc(
						docRef
					);

				let dbData = {};

				if (
					snap.exists()
				) {
					dbData =
						snap.data();
				}

				const userData =
					buildUserData(
						currentUser,
						dbData
					);

				setProfile(
					userData
				);

				await AsyncStorage.setItem(
					"@auth_user",
					JSON.stringify(
						userData
					)
				);
			} catch (error) {
				console.log(
					"Erro refresh profile:",
					error
				);
			}
		};

	/* =====================================================
	   CONTEXT VALUE
	===================================================== */

	const value = useMemo(
		() => ({
			user,

			profile,

			uid:
				user?.uid || "",

			email:
				profile?.email ||
				user?.email ||
				"",

			nome:
				profile?.nome ||
				"",

			foto:
				profile?.foto ||
				null,

			role:
				profile?.role ||
				"user",

			isAdmin:
				profile?.role ===
				"admin",

			loading,

			logout,

			refreshProfile,
		}),
		[
			user,
			profile,
			loading,
		]
	);

	return (
		<AuthContext.Provider
			value={value}
		>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(
		AuthContext
	);
}