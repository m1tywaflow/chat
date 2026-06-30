// export interface CustomEmoji {
//   id: string;
//   url: string;
// }

// export const CUSTOM_EMOJIS: CustomEmoji[] = [
//   {
//     id: "kitya1",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815671/kitya1_nkyyme.png",
//   },
//   {
//     id: "kitya2",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815671/kitya2_x4srnv.png",
//   },
//   {
//     id: "kitya3",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya3_wdg0u2.png",
//   },
//   {
//     id: "kitya4",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya4_uan1mf.png",
//   },
//   {
//     id: "kitya5",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya5_gnyhwb.png",
//   },
//   {
//     id: "kitya6",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya6_jkyw8g.png",
//   },
//   {
//     id: "kitya7",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya7_b1ju9f.png",
//   },
//   {
//     id: "kitya8",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya8_alo3qw.png",
//   },
//   {
//     id: "kitya9",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815671/kitya9_emalmz.png",
//   },
// ];

// export function getCustomEmoji(id: string): CustomEmoji | undefined {
//   return CUSTOM_EMOJIS.find((e) => e.id === id);
// }
export interface CustomEmoji {
  id: string;
  url: string;
}

export const CUSTOM_EMOJIS: CustomEmoji[] = [
  {
    id: "kitya1",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815671/kitya1_nkyyme.png",
  },
  {
    id: "kitya2",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815671/kitya2_x4srnv.png",
  },
  {
    id: "kitya3",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya3_wdg0u2.png",
  },
  {
    id: "kitya4",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya4_uan1mf.png",
  },
  {
    id: "kitya5",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya5_gnyhwb.png",
  },
  {
    id: "kitya6",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya6_jkyw8g.png",
  },
  {
    id: "kitya7",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya7_b1ju9f.png",
  },
  {
    id: "kitya8",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815672/kitya8_alo3qw.png",
  },
  {
    id: "kitya9",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782815671/kitya9_emalmz.png",
  },
];

export function getCustomEmoji(id: string): CustomEmoji | undefined {
  return CUSTOM_EMOJIS.find((e) => e.id === id);
}

export function isCustomEmojiUrl(url: string): boolean {
  return CUSTOM_EMOJIS.some((e) => e.url === url);
}
