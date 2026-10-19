import {
  arrayRemove,
  arrayUnion,
  updateDoc,
  type DocumentReference,
  type FieldValue,
} from "firebase/firestore";

export const POLL_MAX_OPTIONS = 10;
export const POLL_MIN_OPTIONS = 2;
export const POLL_QUESTION_MAX = 200;
export const POLL_OPTION_MAX = 80;

export interface PollOption {
  id: string;
  text: string;
}

export interface Poll {
  question: string;
  options: PollOption[];
  multiple: boolean;
}

export type PollVotes = Record<string, string[]>;

export interface PollMessageFields {
  type: "poll";
  poll: Poll;
  pollVotes: PollVotes;
}

export function buildPollMessage(
  question: string,
  optionTexts: string[],
  multiple: boolean
): PollMessageFields {
  const options = optionTexts
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, POLL_MAX_OPTIONS)
    .map((text, i) => ({ id: `o${i}`, text: text.slice(0, POLL_OPTION_MAX) }));

  const pollVotes: PollVotes = {};
  options.forEach((o) => {
    pollVotes[o.id] = [];
  });

  return {
    type: "poll",
    poll: {
      question: question.trim().slice(0, POLL_QUESTION_MAX),
      options,
      multiple,
    },
    pollVotes,
  };
}

export function isValidPollInput(
  question: string,
  optionTexts: string[]
): boolean {
  const filled = optionTexts.map((t) => t.trim()).filter(Boolean);
  return question.trim().length > 0 && filled.length >= POLL_MIN_OPTIONS;
}

export function countVoters(votes: PollVotes): number {
  const set = new Set<string>();
  Object.values(votes).forEach((list) => list.forEach((uid) => set.add(uid)));
  return set.size;
}

export async function votePoll(
  messageRef: DocumentReference,
  uid: string,
  optionId: string,
  poll: Poll,
  votes: PollVotes
): Promise<void> {
  const alreadyVoted = (votes[optionId] ?? []).includes(uid);
  const update: { [field: string]: FieldValue } = {};

  if (poll.multiple) {
    update[`pollVotes.${optionId}`] = alreadyVoted
      ? arrayRemove(uid)
      : arrayUnion(uid);
  } else if (alreadyVoted) {
    update[`pollVotes.${optionId}`] = arrayRemove(uid);
  } else {
    poll.options.forEach((o) => {
      update[`pollVotes.${o.id}`] =
        o.id === optionId ? arrayUnion(uid) : arrayRemove(uid);
    });
  }

  await updateDoc(messageRef, update);
}
