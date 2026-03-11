
/**
 * Utilitário para upload de imagens no Cloudinary
 */

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const uploadToCloudinary = async (file: File): Promise<string> => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error("Configurações do Cloudinary não encontradas no arquivo .env");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", UPLOAD_PRESET);
    formData.append("folder", "manuals"); // Organiza as fotos em uma pasta "manuals"

    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            {
                method: "POST",
                body: formData,
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || "Erro ao fazer upload para o Cloudinary");
        }

        const data = await response.json();
        return data.secure_url; // Retorna a URL segura (https) da imagem
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw error;
    }
};
