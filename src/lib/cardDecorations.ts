export type CardDecoration = {
  id: string;
  label: string;
  url: string;
  gap: number;
  side: number;
  trimBottom?: number;
};

export const CARD_DECORATIONS: CardDecoration[] = [
  {
    id: "cat-cloud",
    label: "Cat cloud",
    url: "https://res.cloudinary.com/dgylh67ms/image/upload/v1783066630/channel_posts/xx9emzmomk95croglcxn.gif",
    gap: 0,
    side: 0,
  },
];

export const CARD_DECO_BY_ID = new Map(CARD_DECORATIONS.map((d) => [d.id, d]));
