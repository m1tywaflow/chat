export type Gift = {
  id: string;
  name: string;
  imageUrl: string;
  rarity: "common" | "rare" | "epic" | "legendary" | "unreal";
};

export const GIFTS: Record<string, Gift> = {
  samurai: {
    id: "samurai",
    name: "samurai",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782017117/7b6def1234d467fcc28e77c9cc7e3eda_nsylkw.gif",
    rarity: "legendary",
  },
  pepe: {
    id: "pepe",
    name: "Plush Pepe",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782017940/plush-pepe-telegram-pepe_p0l96z.gif",
    rarity: "unreal",
  },
};

export const RARITY_COLORS = {
  common: "#71717a",
  rare: "#60A5FA",
  epic: "#A78BFA",
  legendary: "#FBBF24",
  unreal: "#8C1600",
};
