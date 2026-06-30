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
  {
    id: "cat1",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816918/cat1_rbfuwh.png",
  },
  {
    id: "cat2",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816918/cat2_kn56dy.png",
  },
  {
    id: "cat3",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816919/cat3_isqihx.png",
  },
  {
    id: "cat4",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816919/cat4_tuf43m.png",
  },
  {
    id: "cat5",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816920/cat5_uusd4t.png",
  },
  {
    id: "cat6",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816920/cat6_qtknw2.png",
  },
  {
    id: "cat7",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816921/cat7_p22lgc.png",
  },
  {
    id: "cat8",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816921/cat8_norfto.png",
  },
  {
    id: "cat9",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816922/cat9_xg522n.png",
  },
  {
    id: "skull",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816917/scull_j8tpfn.png",
  },
  {
    id: "bug",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816916/bug_jyclbt.png",
  },
  {
    id: "heart",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816916/heart_tqmnse.png",
  },
  {
    id: "melody",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816916/melody_cewgen.png",
  },
  {
    id: "moon",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816917/moon_xnshnk.png",
  },
  {
    id: "bow",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782816916/bow_gwjn5j.png",
  },
];

export function getCustomEmoji(id: string): CustomEmoji | undefined {
  return CUSTOM_EMOJIS.find((e) => e.id === id);
}

export function isCustomEmojiUrl(url: string): boolean {
  return CUSTOM_EMOJIS.some((e) => e.url === url);
}
