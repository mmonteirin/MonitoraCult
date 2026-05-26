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
	GoogleAuthProvider,
	OAuthProvider,
	signInWithCredential,
} from "firebase/auth";

import {
	doc,
	getDoc,
	setDoc,
	serverTimestamp,
} from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import {
	auth,
	db,
} from "../firebaseConfig";

import logger from "../utils/logger";

WebBrowser.maybeCompleteAuthSession();

// ─── Credenciais OAuth ────────────────────────────────────────
const GOOGLE_CLIENT_ID =
	process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
	"133936734015-pcbmnj1enlb6aocob9qck2mnoeg28i8j.apps.googleusercontent.com";

const FACEBOOK_APP_ID =
	process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "Monitora Cult";
const FACEBOOK_APP_SECRET =
	process.env.EXPO_PUBLIC_FACEBOOK_APP_SECRET || "MonitoraCult";

const MICROSOFT_CLIENT_ID =
	process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_ID || "Monitora Cult";
const MICROSOFT_CLIENT_SECRET =
	process.env.EXPO_PUBLIC_MICROSOFT_CLIENT_SECRET || "MonitoraCult";

const TWITTER_CLIENT_ID =
	process.env.EXPO_PUBLIC_TWITTER_CLIENT_ID || "Monitora Cult";
const TWITTER_CLIENT_SECRET =
	process.env.EXPO_PUBLIC_TWITTER_CLIENT_SECRET || "MonitoraCult";

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

	// ─── Google OAuth hook ───────────────────────────────────────
	const [googleRequest, googleResponse, googlePromptAsync] =
		Google.useAuthRequest({ clientId: GOOGLE_CLIENT_ID });

	// ─── Facebook OAuth hook ─────────────────────────────────────
	const facebookRedirectUri = AuthSession.makeRedirectUri();
	const [facebookRequest, facebookResponse, facebookPromptAsync] =
		AuthSession.useAuthRequest(
			{
				clientId: FACEBOOK_APP_ID,
				redirectUri: facebookRedirectUri,
				scopes: ["public_profile", "email"],
				responseType: AuthSession.ResponseType.Token,
			},
			{
				authorizationEndpoint:
					"https://www.facebook.com/v18.0/dialog/oauth",
			}
		);

	// ─── Microsoft OAuth hook ────────────────────────────────────
	const microsoftRedirectUri = AuthSession.makeRedirectUri();
	const [microsoftRequest, microsoftResponse, microsoftPromptAsync] =
		AuthSession.useAuthRequest(
			{
				clientId: MICROSOFT_CLIENT_ID,
				redirectUri: microsoftRedirectUri,
				scopes: ["openid", "profile", "email"],
				responseType: AuthSession.ResponseType.Code,
			},
			{
				authorizationEndpoint:
					"https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
				tokenEndpoint:
					"https://login.microsoftonline.com/common/oauth2/v2.0/token",
			}
		);

	// ─── Twitter / X OAuth hook ──────────────────────────────────
	const twitterRedirectUri = AuthSession.makeRedirectUri();
	const [twitterRequest, twitterResponse, twitterPromptAsync] =
		AuthSession.useAuthRequest(
			{
				clientId: TWITTER_CLIENT_ID,
				redirectUri: twitterRedirectUri,
				scopes: ["tweet.read", "users.read"],
				responseType: AuthSession.ResponseType.Code,
				usePKCE: true,
			},
			{
				authorizationEndpoint:
					"https://twitter.com/i/oauth2/authorize",
				tokenEndpoint:
					"https://api.twitter.com/2/oauth2/token",
			}
		);

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
	   HELPER — garante doc no Firestore para logins sociais
	===================================================== */

	const ensureFirestoreUser = async (userAuth) => {
		const ref = doc(db, "users", userAuth.uid);
		const snap = await getDoc(ref);

		if (!snap.exists()) {
			await setDoc(ref, {
				uid: userAuth.uid,
				email: userAuth.email || "",
				nome:
					userAuth.displayName ||
					userAuth.email?.split("@")[0] ||
					"Usuário",
				foto:
					userAuth.photoURL ||
					"https://i.pravatar.cc/150",
				role: "user",
				areaAtuacao: null,
				localAtuacao: null,
				cnpj: null,
				followers: 0,
				following: 0,
				createdAt: serverTimestamp(),
			});
		}
	};

	/* =====================================================
	   GOOGLE — resposta OAuth
	===================================================== */

	useEffect(() => {
		if (googleResponse?.type !== "success") return;

		const idToken =
			googleResponse.authentication?.idToken;

		if (!idToken) {
			logger.warn("AuthContext", "Google: idToken ausente");
			return;
		}

		const credential =
			GoogleAuthProvider.credential(idToken);

		signInWithCredential(auth, credential).catch((e) =>
			logger.error("AuthContext", "Google signIn error", e)
		);
	}, [googleResponse]);

	/* =====================================================
	   FACEBOOK — resposta OAuth
	===================================================== */

	useEffect(() => {
		if (facebookResponse?.type !== "success") return;

		const { access_token: accessToken } =
			facebookResponse.params;

		if (!accessToken) {
			logger.warn("AuthContext", "Facebook: access_token ausente");
			return;
		}

		const provider = new OAuthProvider("facebook.com");

		const credential = provider.credential({
			accessToken,
		});

		signInWithCredential(auth, credential).catch((e) =>
			logger.error("AuthContext", "Facebook signIn error", e)
		);
	}, [facebookResponse]);

	/* =====================================================
	   MICROSOFT — resposta OAuth
	===================================================== */

	useEffect(() => {
		if (microsoftResponse?.type !== "success") return;

		const { code } = microsoftResponse.params;

		if (!code) {
			logger.warn("AuthContext", "Microsoft: code ausente");
			return;
		}

		const provider = new OAuthProvider("microsoft.com");

		const credential = provider.credential({ idToken: code });

		signInWithCredential(auth, credential).catch((e) =>
			logger.error("AuthContext", "Microsoft signIn error", e)
		);
	}, [microsoftResponse]);

	/* =====================================================
	   TWITTER — resposta OAuth
	===================================================== */

	useEffect(() => {
		if (twitterResponse?.type !== "success") return;

		const { code } = twitterResponse.params;

		if (!code) {
			logger.warn("AuthContext", "Twitter: code ausente");
			return;
		}

		const provider = new OAuthProvider("twitter.com");

		const credential = provider.credential({ idToken: code });

		signInWithCredential(auth, credential).catch((e) =>
			logger.error("AuthContext", "Twitter signIn error", e)
		);
	}, [twitterResponse]);

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
					logger.error("AuthContext", "Erro cache", error);
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
					logger.debug(
						"AuthContext",
						"Firebase state changed",
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
							/* Login social: cria doc automaticamente */
							await ensureFirestoreUser(
								userAuth
							);
							const newSnap =
								await getDoc(docRef);
							if (newSnap.exists()) {
								dbData = newSnap.data();
							}
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
						logger.error("AuthContext", "ERRO FIRESTORE AUTH", error);

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
				logger.error("AuthContext", "Logout error", error);

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
				logger.error("AuthContext", "Erro refresh profile", error);
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

			// ── Login social ──────────────────────────────
			googleLogin: () =>
				googlePromptAsync(),

			facebookLogin: () =>
				facebookPromptAsync(),

			microsoftLogin: () =>
				microsoftPromptAsync(),

			twitterLogin: () =>
				twitterPromptAsync(),
		}),
		[
			user,
			profile,
			loading,
			googleRequest,
			facebookRequest,
			microsoftRequest,
			twitterRequest,
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