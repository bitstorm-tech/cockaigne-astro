import ImageKit from "imagekit";
import logger from "./logger";

const imagekit = new ImageKit({
	publicKey: import.meta.env.IMAGEKIT_PUBLIC_KEY,
	privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY,
	urlEndpoint: import.meta.env.IMAGEKIT_ENDPOINT_URL,
});

const dealerImagesFolder = "dealer-images";
const dealImagesFolder = "deal-images";
const profileImagesFolder = "profile-images";

export type DeleteProfileImageError = string;

export async function getDealImageUrls(dealId: string, width?: number): Promise<string[]> {
	const files = await imagekit.listFiles({
		path: `${dealImagesFolder}/${dealId}`,
	});

	return files.map((file) => {
		return width
			? imagekit.url({
					src: file.url,
					transformation: [
						{
							width: `${width}`,
						},
					],
				})
			: file.url;
	});
}

export async function getProfileImageUrl(accountId: string): Promise<string | undefined> {
	const files = await imagekit.listFiles({
		path: `${profileImagesFolder}`,
		searchQuery: `name="${accountId}"`,
	});

	if (files.length === 0) {
		return;
	}

	return files[0].url;
}

export async function getDealerImageUrls(dealerId: string): Promise<string[]> {
	const files = await imagekit.listFiles({
		path: `${dealerImagesFolder}/${dealerId}`,
	});

	if (files.length === 0) {
		return [];
	}

	return files.map((file) => file.url);
}

export async function deleteProfileImage(accountId: string): Promise<DeleteProfileImageError | undefined> {
	const files = await imagekit.listFiles({
		path: `${profileImagesFolder}`,
		searchQuery: `name="${accountId}"`,
	});

	if (files.length === 0) {
		return `Can't delete profile image for account ${accountId} -> no file found`;
	}

	await imagekit.deleteFile(files[0].fileId);
}

export async function deleteDealerImage(dealerId: string, imageName: string) {
	const files = await imagekit.listFiles({
		path: `${dealerImagesFolder}/${dealerId}`,
		searchQuery: `name="${imageName}"`,
	});

	if (files.length === 0) {
		logger.error(`Can't delete dealer image ${dealerId}/${imageName}`);
	}

	await imagekit.deleteFile(files[0].fileId);
}

export async function saveProfileImage(accountId: string, image: File) {
	const file = Buffer.from(await image.arrayBuffer());

	await imagekit.upload({
		folder: profileImagesFolder,
		fileName: accountId,
		useUniqueFileName: false,
		file,
	});
}

export async function saveDealerImage(dealerId: string, image: File): Promise<string> {
	const file = Buffer.from(await image.arrayBuffer());

	const result = await imagekit.upload({
		folder: `${dealerImagesFolder}/${dealerId}`,
		fileName: `${Date.now()}`,
		useUniqueFileName: false,
		file,
	});

	return result.url;
}
