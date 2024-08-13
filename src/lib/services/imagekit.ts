import ImageKit from "imagekit";

const imagekit = new ImageKit({
	publicKey: import.meta.env.IMAGEKIT_PUBLIC_KEY,
	privateKey: import.meta.env.IMAGEKIT_PRIVATE_KEY,
	urlEndpoint: import.meta.env.IMAGEKIT_ENDPOINT_URL,
});

const dealerImagesFolder = "dealer-images";
const dealImagesFolder = "deal-images";
const profileImagesFolder = "profile-images";

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
		path: `${profileImagesFolder}/${accountId}`,
	});

	if (files.length === 0) {
		return;
	}

	return files[0].url;
}
