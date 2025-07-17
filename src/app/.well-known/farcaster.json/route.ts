import { getAppUrl } from "~/lib/data";

export async function GET() {
  const appUrl = getAppUrl();
  const accountAssociation = JSON.parse(process.env.WELLKNOWN_JSON);

  const config = {
    accountAssociation,
    frame: {
      version: "1",
      name: "HIGHER.ZIP",
      tagline: "higher higher higher",
      iconUrl: `${appUrl}/web-app-manifest-192x192.png`,
      homeUrl: appUrl,
      imageUrl: `${appUrl}/frame-image.png`,
      buttonTitle: "Open",
      splashImageUrl: `${appUrl}/splash.png`,
      splashBackgroundColor: "#000000",
      webhookUrl: `${appUrl}/api/webhook`,
      primaryCategory: 'art-creativity'
    },
  };

  return Response.json(config);
}
