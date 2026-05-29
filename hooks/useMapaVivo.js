/**
 * useMapaVivo.js
 * Hook completo para o sistema Mapa Vivo da Cultura
 * Gerencia: localização, eventos, heatmap, filtros ao vivo, check-ins
 */

import { useState, useEffect, useCallback, useRef } from "react";
import * as Location from "expo-location";

import {
	getMapEventsFirestore,
	getMapEventsMock,
	getHotspotsFirestore,
	getHotspotsMock,
	realizarCheckIn,
	getCheckInsByEvent,
	getMeusCheckIns,
	getMapaSummary,
} from "../services/mapaVivoService";

const LOCATION_CONFIG = {
	accuracy: Location.Accuracy.Balanced,
	timeInterval: 15000,
	distanceInterval: 30,
};

export const useMapaVivo = () => {
	// ─────────────────────────────────────────────────────────
	// LOCATION
	// ─────────────────────────────────────────────────────────

	const [localizacao, setLocalizacao] = useState(null);

	const [permissaoNegada, setPermissaoNegada] = useState(false);

	// ─────────────────────────────────────────────────────────
	// EVENTOS
	// ─────────────────────────────────────────────────────────

	const [eventos, setEventos] = useState([]);

	const [eventoSelecionado, setEventoSelecionado] =
		useState(null);

	const [loadingEventos, setLoadingEventos] =
		useState(false);

	// ─────────────────────────────────────────────────────────
	// HEATMAP
	// ─────────────────────────────────────────────────────────

	const [hotspots, setHotspots] = useState([]);

	const [mostrarHeatmap, setMostrarHeatmap] =
		useState(false);

	const [loadingHeatmap, setLoadingHeatmap] =
		useState(false);

	// ─────────────────────────────────────────────────────────
	// FILTROS
	// ─────────────────────────────────────────────────────────

	const [generoFiltro, setGeneroFiltro] =
		useState(null);

	const [raioKm, setRaioKm] = useState(10);

	const [apenasProximos, setApenasProximos] =
		useState(false);

	// ─────────────────────────────────────────────────────────
	// CHECK-IN
	// ─────────────────────────────────────────────────────────

	const [checkInsEvento, setCheckInsEvento] =
		useState([]);

	const [meusCheckIns, setMeusCheckIns] = useState([]);

	const [loadingCheckIn, setLoadingCheckIn] =
		useState(false);

	const [successCheckIn, setSuccessCheckIn] =
		useState(false);

	// ─────────────────────────────────────────────────────────
	// RESUMO
	// ─────────────────────────────────────────────────────────

	const [resumoPainel, setResumoPainel] =
		useState(null);

	// ─────────────────────────────────────────────────────────
	// UTILS
	// ─────────────────────────────────────────────────────────

	const [erro, setErro] = useState(null);

	const isMounted = useRef(true);

	const locationSub = useRef(undefined);

	const refreshTimer = useRef(null);

	// ─────────────────────────────────────────────────────────
	// CLEANUP
	// ─────────────────────────────────────────────────────────

	useEffect(() => {
		return () => {
			isMounted.current = false;

			try {
				if (
					locationSub.current &&
					typeof locationSub.current.remove ===
						"function"
				) {
					locationSub.current.remove();
				}
			} catch (e) {
				console.log(
					"Erro removendo location subscription",
					e
				);
			}

			if (refreshTimer.current) {
				clearInterval(refreshTimer.current);
			}
		};
	}, []);

	// ─────────────────────────────────────────────────────────
	// INICIAR LOCALIZAÇÃO
	// ─────────────────────────────────────────────────────────

	const iniciarLocalizacao = useCallback(async () => {
		try {
			const { status } =
				await Location.requestForegroundPermissionsAsync();

			if (status !== "granted") {
				if (isMounted.current) {
					setPermissaoNegada(true);

					// Fortaleza fallback
					setLocalizacao({
						latitude: -3.7327,
						longitude: -38.527,
					});
				}

				return;
			}

			// LOCALIZAÇÃO INICIAL

			const pos =
				await Location.getCurrentPositionAsync({
					accuracy: Location.Accuracy.Balanced,
				});

			if (isMounted.current) {
				setLocalizacao({
					latitude: pos.coords.latitude,
					longitude: pos.coords.longitude,
				});
			}

			// REMOVE SUB ANTIGA
			// evita bug do Expo SDK novo

			try {
				if (
					locationSub.current &&
					typeof locationSub.current.remove ===
						"function"
				) {
					locationSub.current.remove();
				}
			} catch (e) {
				console.log(
					"Erro removendo sub antiga",
					e
				);
			}

			// WATCH POSITION

			const sub =
				await Location.watchPositionAsync(
					LOCATION_CONFIG,
					(pos) => {
						if (isMounted.current) {
							setLocalizacao({
								latitude:
									pos.coords.latitude,
								longitude:
									pos.coords.longitude,
							});
						}
					}
				);

			locationSub.current = sub;
		} catch (err) {
			console.log("Erro localização:", err);

			// fallback Fortaleza

			if (isMounted.current) {
				setLocalizacao({
					latitude: -3.7327,
					longitude: -38.527,
				});
			}
		}
	}, []);

	// ─────────────────────────────────────────────────────────
	// EVENTOS
	// ─────────────────────────────────────────────────────────

	const carregarEventos = useCallback(
		async (lat, lng) => {
			if (!lat || !lng) return;

			if (!isMounted.current) return;

			setLoadingEventos(true);

			setErro(null);

			try {
				const lista =
					await getMapEventsFirestore(
						lat,
						lng,
						generoFiltro
					);

				if (isMounted.current) {
					const filtrados =
						apenasProximos
							? lista.filter(
									(e) =>
										e.distance <=
										raioKm
							  )
							: lista;

					setEventos(filtrados);
				}
			} catch (e) {
				console.log(e);

				const fallback =
					getMapEventsMock(
						lat,
						lng,
						generoFiltro
					);

				if (isMounted.current) {
					setEventos(fallback);
				}
			} finally {
				if (isMounted.current) {
					setLoadingEventos(false);
				}
			}
		},
		[
			generoFiltro,
			apenasProximos,
			raioKm,
		]
	);

	// ─────────────────────────────────────────────────────────
	// HEATMAP
	// ─────────────────────────────────────────────────────────

	const carregarHeatmap = useCallback(
		async (lat, lng) => {
			if (!lat || !lng) return;

			setLoadingHeatmap(true);

			try {
				const data =
					await getHotspotsFirestore(
						lat,
						lng
					);

				if (isMounted.current) {
					setHotspots(data);
				}
			} catch {
				if (isMounted.current) {
					setHotspots(
						getHotspotsMock()
					);
				}
			} finally {
				if (isMounted.current) {
					setLoadingHeatmap(false);
				}
			}
		},
		[]
	);

	// ─────────────────────────────────────────────────────────
	// EFEITO LOCALIZAÇÃO
	// ─────────────────────────────────────────────────────────

	useEffect(() => {
		if (!localizacao) return;

		carregarEventos(
			localizacao.latitude,
			localizacao.longitude
		);

		carregarHeatmap(
			localizacao.latitude,
			localizacao.longitude
		);

		getMapaSummary(
			localizacao.latitude,
			localizacao.longitude
		)
			.then((r) => {
				if (isMounted.current) {
					setResumoPainel(r);
				}
			})
			.catch(() => {});
	}, [
		localizacao,
		generoFiltro,
		carregarEventos,
		carregarHeatmap,
	]);

	// ─────────────────────────────────────────────────────────
	// AUTO REFRESH
	// ─────────────────────────────────────────────────────────

	useEffect(() => {
		if (!localizacao) return;

		if (refreshTimer.current) {
			clearInterval(refreshTimer.current);
		}

		refreshTimer.current = setInterval(() => {
			carregarEventos(
				localizacao.latitude,
				localizacao.longitude
			);
		}, 30000);

		return () => {
			if (refreshTimer.current) {
				clearInterval(refreshTimer.current);
			}
		};
	}, [localizacao, carregarEventos]);

	// ─────────────────────────────────────────────────────────
	// SELECIONAR EVENTO
	// ─────────────────────────────────────────────────────────

	const selecionarEvento = useCallback(
		(evento) => {
			setEventoSelecionado(evento);

			if (evento) {
				carregarCheckInsEvento(
					evento.id
				);
			}
		},
		[]
	);

	// ─────────────────────────────────────────────────────────
	// CHECK-IN
	// ─────────────────────────────────────────────────────────

	const fazerCheckIn = useCallback(
		async (eventId, dados = {}) => {
			if (!localizacao) {
				throw new Error(
					"Localização não disponível"
				);
			}

			setLoadingCheckIn(true);

			setSuccessCheckIn(false);

			try {
				await realizarCheckIn(eventId, {
					latitude:
						localizacao.latitude,
					longitude:
						localizacao.longitude,
					...dados,
				});

				if (isMounted.current) {
					setSuccessCheckIn(true);

					await carregarEventos(
						localizacao.latitude,
						localizacao.longitude
					);

					await carregarCheckInsEvento(
						eventId
					);

					await carregarMeusCheckIns();
				}

				return true;
			} finally {
				if (isMounted.current) {
					setLoadingCheckIn(false);
				}
			}
		},
		[localizacao, carregarEventos]
	);

	const carregarCheckInsEvento =
		useCallback(async (eventId) => {
			try {
				const lista =
					await getCheckInsByEvent(
						eventId
					);

				if (isMounted.current) {
					setCheckInsEvento(lista);
				}
			} catch {
				if (isMounted.current) {
					setCheckInsEvento([]);
				}
			}
		}, []);

	const carregarMeusCheckIns =
		useCallback(async () => {
			try {
				const lista =
					await getMeusCheckIns();

				if (isMounted.current) {
					setMeusCheckIns(lista);
				}
			} catch {
				if (isMounted.current) {
					setMeusCheckIns([]);
				}
			}
		}, []);

	// ─────────────────────────────────────────────────────────
	// TOGGLES
	// ─────────────────────────────────────────────────────────

	const toggleHeatmap = useCallback(() => {
		setMostrarHeatmap((v) => !v);
	}, []);

	const alterarFiltroGenero =
		useCallback((genero) => {
			setGeneroFiltro(genero);

			setEventoSelecionado(null);
		}, []);

	// ─────────────────────────────────────────────────────────
	// REFRESH
	// ─────────────────────────────────────────────────────────

	const refresh = useCallback(() => {
		if (!localizacao) return;

		carregarEventos(
			localizacao.latitude,
			localizacao.longitude
		);

		carregarHeatmap(
			localizacao.latitude,
			localizacao.longitude
		);
	}, [
		localizacao,
		carregarEventos,
		carregarHeatmap,
	]);

	// ─────────────────────────────────────────────────────────
	// EVENTOS PRÓXIMOS
	// ─────────────────────────────────────────────────────────

	const eventosProximos = eventos
		.filter(
			(e) =>
				e.distance !== undefined &&
				e.distance <= 2
		)
		.slice(0, 5);

	return {
		// localização
		localizacao,
		permissaoNegada,
		iniciarLocalizacao,

		// eventos
		eventos,
		eventosProximos,
		eventoSelecionado,
		loadingEventos,
		selecionarEvento,

		// heatmap
		hotspots,
		mostrarHeatmap,
		toggleHeatmap,
		loadingHeatmap,

		// filtros
		generoFiltro,
		alterarFiltroGenero,
		raioKm,
		setRaioKm,
		apenasProximos,
		setApenasProximos,

		// check-in
		checkInsEvento,
		meusCheckIns,
		loadingCheckIn,
		successCheckIn,
		fazerCheckIn,
		carregarCheckInsEvento,
		carregarMeusCheckIns,

		// painel
		resumoPainel,

		// utils
		erro,
		refresh,
	};
};