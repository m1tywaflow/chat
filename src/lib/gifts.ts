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
  pusheen: {
    id: "pusheen",
    name: "Pusheen",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782076770/cat-kitty_azsraw.gif",
    rarity: "unreal",
  },
  jellyfish: {
    id: "jellyfish",
    name: "jellyfish",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782075757/Jellyfish_loves_everyone_qvxxmj.gif",
    rarity: "legendary",
  },
  iphone: {
    id: "iphone",
    name: "iphone",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782075756/phone_ydmvhb.gif",
    rarity: "legendary",
  },
  ronaldo: {
    id: "ronaldo",
    name: "ronaldo",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782077154/200_mul34d.gif",
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
