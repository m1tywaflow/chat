export type Gift = {
  id: string;
  name: string;
  imageUrl: string;
  rarity:
    | "common"
    | "rare"
    | "epic"
    | "legendary"
    | "unreal"
    | "divine"
    | "unusual";
  bgColor?: string;
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
    rarity: "epic",
  },
  dev: {
    id: "dev",
    name: "Dev",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782317827/gif_y3kzrj.gif",
    rarity: "divine",
  },
  ceo: {
    id: "ceo",
    name: "Ceo",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782692370/ceo-netta_dmor0c.gif",
    rarity: "divine",
  },
  fluttershy: {
    id: "fluttershy",
    name: "Fluttershy",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782779438/41db1a69a157396fb9937366b48d45b6_nwljxf.gif",
    rarity: "unusual",
    bgColor: "#7d5279",
  },
  cat: {
    id: "cat",
    name: "White Cat",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782808797/9893dc57cd2e5960840bf9b9f1ae21fb_gmfm6u.gif",
    rarity: "unreal",
  },
  katana: {
    id: "katana",
    name: "Katana",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782818975/katana_jnzip7.gif",
    rarity: "divine",
  },
  melody: {
    id: "melody",
    name: "My Melody",
    imageUrl:
      "https://res.cloudinary.com/dgylh67ms/image/upload/v1782819266/6b7e92fc0474eb2443d72c61b58433d1_gda4he.gif",
    rarity: "unreal",
  },
};

export const RARITY_COLORS = {
  common: "#71717a",
  rare: "#60A5FA",
  epic: "#A78BFA",
  legendary: "#FBBF24",
  unreal: "#A607B3",
  divine: "#FFF3B0",
  unusual: "#7d5279",
};
