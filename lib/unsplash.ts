const BUILDING_PHOTOS = [
  "1515263487990-61b07816b324",
  "1624204386084-dd8c05e32226",
  "1516501312919-d0cb0b7b60b8",
  "1432297984334-707d34c4163a",
  "1571236673892-13d222da2019",
  "1664813953897-ada06817c48c",
  "1605267143746-999bf61d0d08",
  "1676680071181-0a0b45968d23",
  "1651752523215-9bf678c29355",
  "1617341623760-1919df79274c",
];

export function unsplashUrl(photoId: string, width: number, height: number): string {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${height}&fit=crop&auto=format&q=80`;
}

export function buildingFallbackPhoto(buildingId: string): string {
  let hash = 0;
  for (let i = 0; i < buildingId.length; i++) {
    hash = (hash * 31 + buildingId.charCodeAt(i)) & 0xffff;
  }
  return BUILDING_PHOTOS[hash % BUILDING_PHOTOS.length];
}

export const HERO_PHOTO = "1515263487990-61b07816b324";
export const DREAM_LEFT_PHOTO = "1633347910292-53678d953689";
export const DREAM_RIGHT_PHOTO = "1551489424-28aacc79dbc4";
export const CTA_PHOTO = "1635321350281-e2a91ecffd00";
