import * as ImageManipulator from "expo-image-manipulator";

const IMGBB_API_KEY = "16bf8901689afb7a9a2b390275817e88";

const MAX_IMAGE_SIZE = 1500;
const IMAGE_QUALITY = 0.7;

/* 📸 COMPRESSÃO */
const compressImage = async (uri) => {
	try {
		const result = await ImageManipulator.manipulateAsync(
			uri,
			[
				{
					resize: {
						width: MAX_IMAGE_SIZE,
					},
				},
			],
			{
				compress: IMAGE_QUALITY,
				format: ImageManipulator.SaveFormat.JPEG,
			}
		);

		return result.uri;
	} catch (error) {
		console.log("Erro ao comprimir:", error);

		return uri;
	}
};

/* 🔥 URI -> BASE64 (WEB + MOBILE) */
const uriToBase64 = async (uri) => {
	try {
		const response = await fetch(uri);

		const blob = await response.blob();

		return await new Promise((resolve, reject) => {
			const reader = new FileReader();

			reader.onloadend = () => {
				const base64data = reader.result.split(",")[1];

				resolve(base64data);
			};

			reader.onerror = () => {
				reject(new Error("Erro ao converter imagem"));
			};

			reader.readAsDataURL(blob);
		});
	} catch (error) {
		console.log("Erro base64:", error);

		throw new Error("Erro ao ler arquivo");
	}
};

/* 🚀 UPLOAD */
export const uploadImagem = async (
	uri,
	_userId,
	onProgress
) => {
	try {
		if (!uri) {
			throw new Error("Imagem não selecionada");
		}

		if (onProgress) onProgress(0.1);

		/* 1️⃣ Compressão */
		const compressedUri = await compressImage(uri);

		if (onProgress) onProgress(0.4);

		/* 2️⃣ Base64 */
		const base64 = await uriToBase64(compressedUri);

		if (onProgress) onProgress(0.7);

		/* 3️⃣ Upload */
		const formData = new FormData();

		formData.append("key", IMGBB_API_KEY);

		formData.append("image", base64);

		const response = await fetch(
			"https://api.imgbb.com/1/upload",
			{
				method: "POST",
				body: formData,
			}
		);

		const data = await response.json();

		console.log("ImgBB response:", data);

		if (!data.success) {
			throw new Error(
				data.error?.message || "Erro no upload"
			);
		}

		if (onProgress) onProgress(1);

		return data.data.url;

	} catch (error) {
		console.log("Erro upload:", error);

		throw error;
	}
};