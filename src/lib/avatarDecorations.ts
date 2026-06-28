// export const AVATAR_DECORATIONS = [
//   { id: "none", label: "None", url: null },
//   {
//     id: "cat",
//     label: "Cat",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782682529/cat_ears_final_hvlbtw.png",
//   },
//   {
//     id: "metal",
//     label: "Metal",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782681278/Pngtree_metallic_game_avatar_frame_vector_7393471_b4hdfl.png",
//   },
//   {
//     id: "mouse",
//     label: "Mouse",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782682360/Pngtree_mouse_animal_frame_cute_cartoon_8194548_pz5jdb.png",
//   },
//   {
//     id: "luminous",
//     label: "Luminous",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782682912/star_ring_ypy4yx.png",
//   },
//   {
//     id: "ears",
//     label: "Ears",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782683648/pink_bunny_top_udnvu3.png",
//   },
//   {
//     id: "mymelody",
//     label: "MyMelody",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782683534/my_melody_cute_frame_by_mumurini_det9xhc-fullview_idsuf6.png",
//   },
//   {
//     id: "melody-pink",
//     label: "Melody Pink",
//     url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782684057/ChatGPT_Image_29_%D0%B8%D1%8E%D0%BD._2026_%D0%B3._00_01_44_xef0mo.png",
//     // blendMode: "multiply",
//   },
// ];
export const AVATAR_DECORATIONS: {
  id: string;
  label: string;
  url: string | null;
  blendMode?: string;
}[] = [
  { id: "none", label: "None", url: null },
  {
    id: "cat",
    label: "Cat",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782682529/cat_ears_final_hvlbtw.png",
  },
  {
    id: "metal",
    label: "Metal",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782681278/Pngtree_metallic_game_avatar_frame_vector_7393471_b4hdfl.png",
  },
  {
    id: "mouse",
    label: "Mouse",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782682360/Pngtree_mouse_animal_frame_cute_cartoon_8194548_pz5jdb.png",
  },
  {
    id: "luminous",
    label: "Luminous",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782682912/star_ring_ypy4yx.png",
    blendMode: "screen",
  },
  {
    id: "ears",
    label: "Ears",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782683648/pink_bunny_top_udnvu3.png",
    blendMode: "screen",
  },
  {
    id: "mymelody",
    label: "MyMelody",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782683534/my_melody_cute_frame_by_mumurini_det9xhc-fullview_idsuf6.png",
  },
  {
    id: "melody-pink",
    label: "Melody Pink",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782684057/ChatGPT_Image_29_%D0%B8%D1%8E%D0%BD._2026_%D0%B3._00_01_44_xef0mo.png",
    // blendMode: "multiply",
  },
  {
    id: "melody",
    label: "Melody",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1782685475/bad1897627cd2df7030108a815a8f295-removebg-preview_2_heuhsw.png",
    // blendMode: "multiply",
  },
];
